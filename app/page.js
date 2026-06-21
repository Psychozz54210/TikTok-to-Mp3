"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [filename, setFilename] = useState("");

  const handleExtract = async (e) => {
    e.preventDefault();
    if (!url) {
      setError("Please enter a valid TikTok URL");
      return;
    }

    setIsLoading(true);
    setError("");
    setDownloadUrl("");
    setFilename("");

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download media");
      }

      // The server returns the final MP3 buffer directly
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let extractedFilename = "audio.mp3";
      
      if (contentDisposition && contentDisposition.includes("filename=")) {
        extractedFilename = contentDisposition.split("filename=")[1].replace(/"/g, "");
      }

      const objUrl = window.URL.createObjectURL(blob);
      setDownloadUrl(objUrl);
      setFilename(extractedFilename);
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
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
              disabled={isLoading || downloadUrl !== ""}
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
              Fetching audio... This is super fast!
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
