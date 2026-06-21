"use client";

import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [filename, setFilename] = useState("");
  
  const ffmpegRef = useRef(null);
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);

  useEffect(() => {
    const loadFFmpeg = async () => {
      // Instantiate FFmpeg only on the client side
      ffmpegRef.current = new FFmpeg();
      const ffmpeg = ffmpegRef.current;
      
      ffmpeg.on("log", ({ message }) => {
        console.log(message);
      });
      
      try {
        await ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        });
        setIsFfmpegLoaded(true);
      } catch (err) {
        console.error("Failed to load FFmpeg", err);
        setError("Failed to initialize conversion engine. Your browser might not support it.");
      }
    };
    
    loadFFmpeg();
  }, []);

  const handleExtract = async (e) => {
    e.preventDefault();
    if (!url) {
      setError("Please enter a valid TikTok URL");
      return;
    }

    if (!isFfmpegLoaded) {
      setError("Conversion engine is still loading. Please wait a moment.");
      return;
    }

    setIsLoading(true);
    setError("");
    setDownloadUrl("");
    setFilename("");

    try {
      setStatusText("Fetching raw media from server...");
      
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download media");
      }

      // We get the raw data from the proxy server
      const blob = await response.blob();
      const rawData = await fetchFile(blob);

      setStatusText("Converting media to MP3 locally...");
      
      const ffmpeg = ffmpegRef.current;
      const inputName = "input_media";
      const outputName = "output_audio.mp3";

      // Write raw file to FFmpeg's virtual file system
      await ffmpeg.writeFile(inputName, rawData);

      // Execute conversion command
      // -i input : input file
      // -q:a 0 : best variable bitrate audio quality
      // -map a : extract only audio
      await ffmpeg.exec(["-i", inputName, "-q:a", "0", "-map", "a", outputName]);

      // Read the result back from virtual file system
      const data = await ffmpeg.readFile(outputName);
      
      // Clean up virtual file system
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      // Create downloadable URL
      const finalBlob = new Blob([data], { type: "audio/mpeg" });
      const objUrl = window.URL.createObjectURL(finalBlob);
      
      setStatusText("Done!");
      setDownloadUrl(objUrl);
      setFilename(`audiotok-${Date.now()}.mp3`);

    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during conversion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <main className="container">
        <h1 className="hero-title">TikTok to MP3</h1>
        <p className="hero-subtitle">
          Extract high-quality MP3 audio from any TikTok video instantly.
        </p>

        <div className="glass-panel">
          <form className="input-group" onSubmit={handleExtract}>
            <input
              type="url"
              className="url-input"
              placeholder="Paste TikTok link here..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              required
            />
            
            <button 
              type="submit" 
              className="btn" 
              disabled={isLoading || downloadUrl !== "" || !isFfmpegLoaded}
            >
              {isLoading ? (
                <>
                  <span className="loader"></span>
                  Processing...
                </>
              ) : (
                "Extract Audio"
              )}
            </button>
          </form>

          {error && <div className="status-message status-error">{error}</div>}
          {isLoading && !error && (
            <div className="status-message status-success">
              {statusText}
            </div>
          )}
          {!isFfmpegLoaded && !error && (
            <div className="status-message">
              Loading conversion engine...
            </div>
          )}

          {downloadUrl && (
            <div className="result-card">
              <h3 className="result-title">Ready to Download!</h3>
              <a 
                href={downloadUrl} 
                download={filename} 
                className="btn btn-download"
                onClick={() => {
                  // Optional: revoke object URL after some time to free memory
                  setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
                }}
              >
                Download MP3
              </a>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
