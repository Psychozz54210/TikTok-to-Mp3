import { NextResponse } from "next/server";
import { readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";
import youtubedl from "youtube-dl-exec";

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const videoId = uuidv4();
    const outputPath = join(tmpdir(), `${videoId}.%(ext)s`);

    // Download raw media using yt-dlp WITHOUT conversion
    // We request 'best' format because TikTok often doesn't have an audio-only stream
    await youtubedl(url, {
      format: "best",
      output: outputPath,
      noWarnings: true,
      noCheckCertificates: true,
      addHeader: [
        'referer:tiktok.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    });

    // We don't know the exact extension yt-dlp chose, so we list the temp dir
    // to find the downloaded file.
    const fs = require('fs');
    const files = fs.readdirSync(tmpdir());
    const downloadedFile = files.find(f => f.startsWith(videoId));

    if (!downloadedFile) {
      throw new Error("Downloaded file not found.");
    }

    const actualFile = join(tmpdir(), downloadedFile);
    
    let fileBuffer;
    try {
      fileBuffer = readFileSync(actualFile);
    } catch (err) {
      console.error("Error reading extracted file:", err);
      return NextResponse.json({ error: "Could not read the downloaded file." }, { status: 500 });
    }
    
    // Clean up temp file
    try {
      unlinkSync(actualFile);
    } catch (e) {
      console.error("Cleanup error:", e);
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="raw-${videoId.substring(0, 8)}.raw"`,
      },
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to download media. Please check the URL and try again." }, 
      { status: 500 }
    );
  }
}
