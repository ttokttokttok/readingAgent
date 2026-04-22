# Implementation Plan: Voice Definition Agent

## Overview

Build a browser-based, hands-free dictionary agent using ElevenLabs Conversational AI. The implementation proceeds in four phases: backend server (signed URL + webhook), ElevenLabs agent provisioning, browser client, and property-based tests. Each phase is independently testable before wiring everything together.

## Tasks

- [x] 1. Initialize project structure and dependencies
  - Create `package.json` with `express`, `dotenv`, `node-fetch` (or native fetch), `@elevenlabs/elevenlabs-js`, and dev dependencies `jest`, `supertest`, `fast-check`
  - Create `.env.example` with `ELEVENLABS_API_KEY`, `AGENT_ID`, `BACKEND_URL`, `PORT`
  - Create `src/` directory with `server.js`, `defineHandler.js`, `agentConfig.js`, and `public/` for browser assets
  - Add `jest.config.js` configured for async tests with a 15 s timeout
  - _Requirements: 3.1, 7.5_

- [x] 2. Implement the dictionary webhook handler
  - [x] 2.1 Implement `defineHandler.js` — fetch from Free Dictionary API and format result
    - `GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}` and extract first definition, part of speech, etymology, example, and phonetic
    - Format into a single readable `result` string: `"{Word} ({partOfSpeech}): {definition}. Origin: {etymology}. Example: {example}."`
    - Omit etymology/example clauses when the API does not return them
    - Return `{ result: "I couldn't find a definition for '{word}'. Could you check the spelling?" }` on 404
    - Return `{ result: "The dictionary service is temporarily unavailable. Please try again in a moment." }` on 5xx or network timeout
    - Return HTTP 400 `{ error: "word parameter is required" }` when `word` is missing or empty
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.2, 4.4_

  - [ ]* 2.2 Write unit tests for `defineHandler.js`
    - Test: known word returns formatted `result` string containing definition
    - Test: unknown word (404) returns "not found" result string
    - Test: missing `word` parameter returns HTTP 400
    - Test: etymology and example are included when present in API response
    - Test: etymology and example are omitted when absent in API response
    - Test: dictionary API timeout returns graceful error result
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Implement the Express backend server
  - [x] 3.1 Implement `GET /api/signed-url` in `server.js`
    - Use `@elevenlabs/elevenlabs-js` client: `elevenlabs.conversationalAi.conversations.getSignedUrl({ agentId: process.env.AGENT_ID })`
    - Return `{ signedUrl }` on success; return HTTP 500 with `{ error: "Failed to issue session URL" }` on failure
    - _Requirements: 7.5_

  - [x] 3.2 Implement `POST /api/define` in `server.js`
    - Parse `parameters.word` from the ElevenLabs webhook body (shape: `{ tool_call_id, tool_name, parameters: { word }, conversation_id }`)
    - Delegate to `defineHandler.js` and return its result
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.3 Write unit tests for server routes
    - Test: `GET /api/signed-url` returns `{ signedUrl }` when ElevenLabs client succeeds (mock client)
    - Test: `GET /api/signed-url` returns HTTP 500 when ElevenLabs client throws
    - Test: `POST /api/define` extracts `parameters.word` and returns `defineHandler` result
    - _Requirements: 3.1, 7.5_

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Run `npx jest --testPathPattern="server|defineHandler" --forceExit` and confirm all tests pass
  - Ask the user if any questions arise before proceeding

- [x] 5. Provision the ElevenLabs agent
  - [x] 5.1 Implement `agentConfig.js` — build and export the agent creation payload
    - Define the full agent config object matching the design: `conversationConfig` (TTS `eleven_flash_v2_5`, voice Rachel `JBFqnCBsd6RMkjVDRZzb`, stability 0.6, `server_vad` with 500 ms silence), `prompt` (gpt-4o-mini, temperature 0.3, system prompt), and `tools` array (`define_word` webhook + `end_call` system tool)
    - _Requirements: 1.2, 1.4, 5.1, 5.2, 6.1, 6.4_

  - [x] 5.2 Implement `scripts/createAgent.js` — one-time provisioning script
    - Call `elevenlabs.conversationalAi.agents.create(agentConfig)`, print the returned `agent_id`, and instruct the user to add it to `.env` as `AGENT_ID`
    - _Requirements: 5.1, 5.2_

  - [ ]* 5.3 Write unit tests for agent configuration shape
    - Test: `turn.mode === "server_vad"`
    - Test: `turn.silenceThresholdMs === 500`
    - Test: `tts.modelId === "eleven_flash_v2_5"`
    - Test: `tts.stability` is between 0.5 and 0.7
    - Test: tools array contains a `system` tool named `end_call`
    - Test: tools array contains a `webhook` tool named `define_word`
    - _Requirements: 1.2, 1.4, 5.1, 5.2, 6.1_

- [x] 6. Implement the browser client
  - [x] 6.1 Create `public/index.html`
    - Single page with a "Start / Stop" toggle button, a status indicator element, and a microphone-denied fallback message (hidden by default)
    - Import `client.js` as an ES module; load `@elevenlabs/client` from CDN or bundled
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 6.2 Implement `public/client.js` — session lifecycle logic
    - On button click: request microphone permission; on denial show fallback text and return
    - Fetch signed URL from `GET /api/signed-url`; on failure display "Could not connect to the server. Please try again."
    - Call `Conversation.startSession({ signedUrl, onConnect, onDisconnect, onError, onModeChange })` and update status indicator accordingly (`idle → connecting → listening → speaking → idle`)
    - On stop click: call `conversation.endSession()` and reset status to idle
    - Handle WebSocket disconnect mid-session: update status to "disconnected" and show a "Reconnect" button
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 6.2_

  - [ ]* 6.3 Write unit tests for browser client state transitions
    - Test: `startSession` is NOT called on page load
    - Test: `GET /api/signed-url` is called before `startSession`
    - Test: microphone-denied error message is shown when permission is refused
    - Test: status transitions idle → connecting → listening → speaking → idle
    - _Requirements: 7.2, 7.3, 7.4_

- [ ] 7. Write property-based tests for the webhook handler
  - [ ]* 7.1 Write property test for Property 1 — webhook returns a result for any valid word
    - Use `fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)` as the word generator
    - Assert: `POST /api/define` returns HTTP 200 with a non-empty `result` string for every generated word
    - Run 100 iterations (`numRuns: 100`)
    - **Property 1: Webhook returns a result for any valid word**
    - **Validates: Requirements 3.1, 3.4**

  - [ ]* 7.2 Write property test for Property 2 — webhook handles unknown words gracefully
    - Use `fc.stringMatching(/^[a-z]{15,30}$/)` to generate nonsense strings unlikely to be real words
    - Assert: `POST /api/define` returns HTTP 200 with a non-empty `result` string (never empty, never throws)
    - Run 100 iterations (`numRuns: 100`)
    - **Property 2: Webhook handles unknown words gracefully**
    - **Validates: Requirements 3.3**

  - [ ]* 7.3 Write property test for Property 3 — webhook result includes all available dictionary data
    - Mock the dictionary API using `fc.record({ word: fc.string({ minLength: 1 }), hasEtymology: fc.boolean(), hasExample: fc.boolean() })`
    - When `hasEtymology` is true, assert `result` contains the etymology text; when `hasExample` is true, assert `result` contains the example text
    - Run 100 iterations (`numRuns: 100`)
    - **Property 3: Webhook result includes all available dictionary data**
    - **Validates: Requirements 4.2, 4.4**

- [x] 8. Final checkpoint — Ensure all tests pass
  - Run `npx jest --forceExit` and confirm all unit and property tests pass
  - Ensure `scripts/createAgent.js` runs without error (requires valid `ELEVENLABS_API_KEY` in `.env`)
  - Ask the user if any questions arise before considering the implementation complete

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests (7.1–7.3) require the real or mocked Free Dictionary API; use `nock` or `jest.mock` to intercept HTTP calls in CI
- Run `node scripts/createAgent.js` once after completing task 5 to provision the agent and obtain `AGENT_ID`
- The browser client requires a bundler (e.g., `esbuild`) or a CDN import for `@elevenlabs/client`; add a `build` script to `package.json` if bundling
- All conversational context (follow-up questions, session memory) is managed entirely by the ElevenLabs agent — the backend is stateless
