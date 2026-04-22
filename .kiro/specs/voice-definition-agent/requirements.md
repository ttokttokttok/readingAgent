# Requirements Document

## Introduction

The Voice Definition Agent is a hands-free dictionary assistant designed for readers. While reading a book, the user can speak a word or phrase aloud and receive a clear, concise spoken definition — no typing required. The agent is conversational: it gives a simple answer by default, and only goes deeper (etymology, pronunciation, usage examples) when the user asks follow-up questions. The agent is powered by ElevenLabs Conversational AI, using ElevenLabs for speech-to-text (listening), a language model for definitions, and ElevenLabs text-to-speech (speaking the answer back).

## Glossary

- **Agent**: The ElevenLabs Conversational AI agent that manages the full voice conversation lifecycle.
- **User**: A person reading a book who wants to look up a word by speaking.
- **Definition_Response**: The spoken reply the Agent delivers to the User containing a word's meaning.
- **Follow_Up**: A subsequent spoken question from the User requesting additional detail about the same word (e.g., etymology, pronunciation, usage).
- **Session**: A single continuous voice conversation between the User and the Agent, from activation to termination.
- **STT**: Speech-to-text — the ElevenLabs Scribe model that transcribes the User's spoken input.
- **TTS**: Text-to-speech — the ElevenLabs voice model that speaks the Agent's response aloud.
- **Webhook_Tool**: A backend HTTP endpoint the Agent calls to fetch word definitions from a dictionary data source.

---

## Requirements

### Requirement 1: Voice Activation and Listening

**User Story:** As a reader, I want to activate the agent by speaking, so that I never have to stop reading to type.

#### Acceptance Criteria

1. WHEN the User speaks into the microphone, THE Agent SHALL transcribe the spoken input using the ElevenLabs STT model.
2. WHEN the User's speech ends and a silence of 500ms or more is detected, THE Agent SHALL finalize the transcription and begin processing the request.
3. IF the STT model fails to transcribe the input, THEN THE Agent SHALL respond with a spoken prompt asking the User to repeat the word.
4. THE Agent SHALL use server-side voice activity detection (VAD) to determine when the User has finished speaking.

---

### Requirement 2: Simple Definition by Default

**User Story:** As a reader, I want to hear a short, plain-language definition immediately, so that I can quickly understand a word and get back to reading.

#### Acceptance Criteria

1. WHEN the User asks "what does [word] mean" or any equivalent phrasing, THE Agent SHALL respond with a single-sentence definition of the word.
2. THE Agent SHALL deliver the Definition_Response in spoken audio using the ElevenLabs TTS model within 3 seconds of finalizing the transcription.
3. THE Agent SHALL limit the default Definition_Response to no more than 2 sentences unless the User explicitly requests more detail.
4. THE Agent SHALL use plain, everyday language in the Definition_Response, avoiding technical jargon unless the word itself is a technical term.

---

### Requirement 3: Webhook-Based Dictionary Lookup

**User Story:** As a developer, I want the agent to fetch definitions from a reliable data source, so that definitions are accurate and not hallucinated by the language model.

#### Acceptance Criteria

1. WHEN the Agent identifies a word to define, THE Agent SHALL invoke the Webhook_Tool with the word as a parameter to retrieve its definition.
2. WHEN the Webhook_Tool returns a successful response, THE Agent SHALL use the returned definition data to construct the Definition_Response.
3. IF the Webhook_Tool returns an error or the word is not found, THEN THE Agent SHALL inform the User that the word could not be found and ask the User to confirm the spelling.
4. THE Webhook_Tool SHALL accept a single `word` string parameter and return a structured response containing at minimum a `definition` field.

---

### Requirement 4: Conversational Follow-Up for Deeper Detail

**User Story:** As a curious reader, I want to ask follow-up questions about a word, so that I can learn more without starting a new lookup.

#### Acceptance Criteria

1. WHEN the User asks a follow-up question about the current word (e.g., "where does it come from?", "how do you pronounce it?", "can you use it in a sentence?"), THE Agent SHALL respond with the requested detail without requiring the User to repeat the word.
2. WHEN the User asks for etymology, THE Agent SHALL provide the word's language of origin and historical meaning.
3. WHEN the User asks for pronunciation, THE Agent SHALL speak the word slowly and clearly, emphasizing each syllable.
4. WHEN the User asks for a usage example, THE Agent SHALL provide one example sentence using the word in context.
5. THE Agent SHALL maintain conversational context for the duration of the Session so that follow-up questions refer to the most recently looked-up word.

---

### Requirement 5: Natural Conversational Voice

**User Story:** As a reader, I want the agent's voice to sound natural and calm, so that it doesn't disrupt my reading flow.

#### Acceptance Criteria

1. THE Agent SHALL use an ElevenLabs TTS voice configured with a stability value between 0.5 and 0.7 to produce consistent, calm speech.
2. THE Agent SHALL use the `eleven_flash_v2_5` TTS model to minimize response latency.
3. THE Agent SHALL keep responses concise — the default Definition_Response SHALL be speakable in under 10 seconds of audio.
4. WHERE the User has not configured a preferred voice, THE Agent SHALL use a default voice suitable for calm, clear narration.

---

### Requirement 6: Session Management

**User Story:** As a reader, I want the agent to stay ready during my reading session and end cleanly when I'm done, so that it doesn't interrupt me unnecessarily.

#### Acceptance Criteria

1. WHEN the User says "goodbye", "stop", "exit", or an equivalent phrase, THE Agent SHALL end the Session gracefully using the system end-call tool.
2. WHILE a Session is active, THE Agent SHALL remain listening and ready to accept new word lookups without requiring re-activation.
3. IF the Session has been silent for 5 minutes with no User input, THEN THE Agent SHALL end the Session automatically.
4. THE Agent SHALL greet the User with a brief spoken welcome message at the start of each Session (e.g., "Hi, I'm ready. Just say any word you'd like defined.").

---

### Requirement 7: Client-Side Browser Integration

**User Story:** As a developer, I want to embed the agent in a web page, so that readers can use it directly in their browser without installing anything.

#### Acceptance Criteria

1. THE Agent SHALL be accessible via the ElevenLabs `@elevenlabs/client` browser SDK.
2. WHEN the web page loads, THE Agent SHALL NOT start a Session automatically — the User SHALL initiate the Session by clicking a button or activating a control.
3. THE Agent SHALL request microphone permission from the browser before starting the Session.
4. IF the browser denies microphone permission, THEN THE Agent SHALL display a text message informing the User that microphone access is required.
5. WHERE the deployment environment requires authentication, THE Agent SHALL obtain a signed session URL from a backend endpoint rather than exposing the API key in the browser.
