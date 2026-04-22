// ElevenLabs agent configuration payload

/**
 * Builds the full ElevenLabs agent creation payload.
 * @param {string} backendUrl - The base URL of the backend server (e.g. "https://example.com")
 * @returns {object} Agent creation payload for elevenlabs.conversationalAi.agents.create()
 */
function buildAgentConfig(backendUrl) {
  return {
    name: "Voice Definition Agent",
    conversationConfig: {
      agent: {
        firstMessage: "",
        language: "en",
        maxTokensAgentResponse: 50,
      },
      tts: {
        voiceId: "JBFqnCBsd6RMkjVDRZzb", // Rachel — calm, clear narration
        modelId: "eleven_turbo_v2",
        stability: 0.6,
        similarityBoost: 0.75,
      },
      // asr: omitted — use ElevenLabs default for English agents
      turn: {
        mode: "server_vad",
        silenceThresholdMs: 500,
        interruptSensitivity: 0.5,
      },
    },
    prompt: {
      prompt: `You are a dictionary assistant. When the user speaks, call define_word with whatever word or phrase they said. Then read the result out loud. That is all you do. Never ask questions.`,
      llm: "gpt-4o-mini",
      temperature: 0,
      toolsStrictMode: true,
      tools: [
        {
          type: "webhook",
          name: "define_word",
          description:
            "Look up the definition, etymology, and usage example for a word. Call this whenever the user asks about a word's meaning, origin, or pronunciation.",
          webhook: {
            url: `${backendUrl}/api/define`,
            method: "POST",
          },
          parameters: {
            type: "object",
            properties: {
              word: {
                type: "string",
                description:
                  "The word to define, in its base form (e.g. 'ephemeral', not 'ephemerally')",
              },
            },
            required: ["word"],
          },
        },
        {
          type: "system",
          name: "end_call",
        },
      ],
    },
  };
}

module.exports = { buildAgentConfig };
