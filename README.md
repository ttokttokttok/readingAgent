# Reading Companion

A voice-controlled reading companion app built with **Kiro** and **ElevenLabs** for the ElevenHacks x Kiro Hackathon.

Speak a word while reading and hear its definition instantly. Set a reading timer and play ambient music — all hands-free, all by voice.

## What it does

- **Voice word definitions** — say any word and the ElevenLabs Conversational AI agent defines it immediately
- **Reading timer** — say "set a timer for 25 minutes" and a countdown appears and starts
- **Ambient music** — say "play lofi hip hop" and YouTube music starts playing automatically
- **Voice controls** — pause/resume the timer, stop music, all by voice
- **Auto-duck** — music volume lowers automatically when the agent speaks

## How Kiro was used

This project was built entirely using Kiro's spec-driven development workflow:

1. **Specs** — wrote `requirements.md`, `design.md`, and `tasks.md` for both the voice definition agent and the reading timer/music features using Kiro's spec workflow. Kiro generated all three documents iteratively with user feedback at each stage.

2. **Task execution** — ran all implementation tasks through Kiro ("run all tasks"), which sequentially implemented each component: the Express backend, dictionary webhook handler, ElevenLabs agent configuration, browser client, timer module, YouTube search integration, and voice-controlled client tools.

3. **ElevenLabs Kiro Power** — used the installed ElevenLabs Power to get accurate API guidance for Conversational AI agent configuration, client tools, TTS/STT settings, and signed URL authentication.

4. **Iterative debugging** — used Kiro to diagnose and fix issues with ElevenLabs agent tool registration, YouTube IFrame API limitations, and client tool parameter schemas — all through conversation.

The `.kiro/specs/` directory contains the full spec artifacts showing the spec-driven development process.

## Tech stack

- **ElevenLabs Conversational AI** — STT, TTS, agent orchestration, client tools
- **Node.js + Express** — backend server, signed URL endpoint, dictionary webhook, YouTube search proxy
- **Free Dictionary API** — accurate word definitions (no hallucinations)
- **YouTube Data API v3** — music search
- **Vanilla JS + esbuild** — browser client, no framework

## Setup

**Prerequisites:** Node.js 18+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|----------|-------------|
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key |
| `AGENT_ID` | Set after running the provisioning script (step 3) |
| `BACKEND_URL` | Public URL of your backend (e.g. `http://localhost:3000`) |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key (free, from Google Cloud Console) |
| `PORT` | Server port (default: `3000`) |

### 3. Provision the ElevenLabs agent (one-time)

```bash
node scripts/createAgent.js
```

Copy the printed agent ID into `.env` as `AGENT_ID`, then push the full agent config:

```bash
node scripts/updateAgent.js
```

### 4. Build the browser bundle

```bash
npm run build
```

### 5. Start the server

```bash
npm start
```

Open `http://localhost:3000` in your browser.

## Voice commands

| Say | Action |
|-----|--------|
| Any word | Define it |
| "What does [word] mean?" | Define it |
| "Set a timer for 25 minutes" | Start a 25-minute reading timer |
| "Pause the timer" / "Resume the timer" | Pause/resume timer |
| "Reset the timer" | Reset timer |
| "Play lofi hip hop" | Search and autoplay YouTube music |
| "Stop the music" | Pause music |
| "Goodbye" / "Stop" | End the voice session |

## Running tests

```bash
npm test
```

## License

MIT
