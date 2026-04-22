// Express server: signed URL endpoint + dictionary webhook
require("dotenv").config();

const express = require("express");
const path = require("path");
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const { defineWord } = require("./defineHandler");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Task 3.1 — GET /api/signed-url
app.get("/api/signed-url", async (req, res) => {
  try {
    const result = await elevenlabs.conversationalAi.conversations.getSignedUrl({
      agentId: process.env.AGENT_ID,
    });
    res.json({ signedUrl: result.signedUrl });
  } catch (err) {
    res.status(500).json({ error: "Failed to issue session URL" });
  }
});

// Task 3.2 — POST /api/define
app.post("/api/define", async (req, res) => {
  const word = req.body && req.body.parameters && req.body.parameters.word;

  if (!word || !String(word).trim()) {
    return res.status(400).json({ error: "word parameter is required" });
  }

  const result = await defineWord(word);
  res.json(result);
});

// GET /api/youtube/search?q=lofi
app.get("/api/youtube/search", async (req, res) => {
  const q = req.query.q;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: "q parameter is required" });
  }
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "YouTube API key not configured" });
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=8&q=${encodeURIComponent(q.trim())}&key=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || "YouTube API error" });
    }
    const data = await response.json();
    const results = (data.items || []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.default?.url,
    }));
    res.json({ results });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach YouTube API" });
  }
});


if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app };
