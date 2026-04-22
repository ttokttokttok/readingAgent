require("dotenv").config();

// Test minimal client tool shape
const payload = {
  conversation_config: {
    agent: {
      prompt: {
        tools: [
          {
            type: "client",
            name: "start_timer",
            description: "Start the reading timer.",
            parameters: {
              type: "object",
              properties: {
                minutes: {
                  type: "number",
                  description: "Duration in minutes e.g. 25",
                },
              },
              required: ["minutes"],
            },
          },
        ],
      },
    },
  },
};

async function main() {
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${process.env.AGENT_ID}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Failed:", JSON.stringify(data, null, 2));
  } else {
    const tools = data?.conversation_config?.agent?.prompt?.tools || [];
    console.log("Success. Tools:", tools.map(t => `${t.type}:${t.name}`).join(", "));
  }
}

main().catch(console.error);
