import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Call TikWM API to get the media data
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const apiResponse = await fetch(apiUrl);
    const data = await apiResponse.json();

    if (data.code !== 0 || !data.data || !data.data.music_info) {
      return NextResponse.json(
        { error: "Could not find audio for this TikTok." },
        { status: 404 }
      );
    }

    // This is the direct URL to the MP3 file hosted on TikTok's CDN
    const audioUrl = data.data.music_info.play;

    // We fetch the actual MP3 file from the CDN
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      throw new Error("Failed to fetch audio stream");
    }

    // Stream it directly to the user
    const buffer = await audioRes.arrayBuffer();

    // Create a safe filename
    const videoId = data.data.id || Date.now().toString();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="audiotok-${videoId}.mp3"`,
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
