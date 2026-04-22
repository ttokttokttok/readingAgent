require("dotenv").config();

const AGENT_ID = process.env.AGENT_ID;
const API_KEY = process.env.ELEVENLABS_API_KEY;
const BACKEND_URL = process.env.BACKEND_URL;

if (!AGENT_ID || !API_KEY || !BACKEND_URL) {
  console.error("Missing AGENT_ID, ELEVENLABS_API_KEY, or BACKEND_URL in .env");
  process.exit(1);
}

const payload = {
  conversation_config: {
    agent: {
      first_message: "",
      language: "en",
      max_tokens_agent_response: 80,
      prompt: {
        prompt: `You are a reading companion assistant. You help readers in two ways:

1. DEFINE WORDS: When the user says a word or asks what a word means, call define_word immediately. Read the result. Stop. Never ask follow-up questions.

2. CONTROL THE APP: You can also control the timer and music:
- play_music: call when user says "play [genre]", "search for [music]", "put on some [music]"
- pause_music: call when user says "pause music", "stop music", "mute"
- start_timer: call when user says "start a [N] minute timer", "set timer for [N] minutes"
- pause_timer: call when user says "pause timer", "resume timer"
- reset_timer: call when user says "reset timer", "stop timer"

Always call the right tool immediately. Never ask clarifying questions. After acting, confirm briefly (e.g. "Done", "Playing lofi", "Timer started"). If the user says goodbye, stop, or exit, call end_call.`,
        llm: "gpt-4o-mini",
        temperature: 0,
        tools_strict_mode: true,
        tools: [
          {
            type: "client",
            name: "play_music",
            description: "Search YouTube and play music. Call when user asks to play or search for music.",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "Music search query e.g. 'lofi hip hop'" },
              },
              required: ["query"],
            },
          },
          {
            type: "client",
            name: "pause_music",
            description: "Pause or stop the music.",
            parameters: { type: "object", properties: {} },
          },
          {
            type: "client",
            name: "start_timer",
            description: "Start the reading timer for N minutes.",
            parameters: {
              type: "object",
              properties: {
                minutes: { type: "number", description: "Duration in minutes e.g. 25" },
              },
              required: ["minutes"],
            },
          },
          {
            type: "client",
            name: "pause_timer",
            description: "Pause or resume the reading timer.",
            parameters: { type: "object", properties: {} },
          },
          {
            type: "client",
            name: "reset_timer",
            description: "Reset the reading timer.",
            parameters: { type: "object", properties: {} },
          },
        ],
      },
    },
    tts: {
      voice_id: "JBFqnCBsd6RMkjVDRZzb",
      model_id: "eleven_turbo_v2",
      stability: 0.6,
      similarity_boost: 0.75,
    },
    turn: {
      mode: "silence",
      silence_threshold_ms: 500,
    },
  },
};

async function main() {
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const tools = data?.conversation_config?.agent?.prompt?.tools || [];
  console.log(`Agent updated. Tools: ${tools.map(t => t.name).join(", ")}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
