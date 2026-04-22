require("dotenv").config();
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const client = new ElevenLabsClient();

client.conversationalAi.agents.get(process.env.AGENT_ID).then((d) => {
  const tools = d.conversationConfig?.agent?.prompt?.tools || [];
  console.log("Tools registered on agent:");
  tools.forEach((t) => console.log(" -", t.type, t.name));
  if (tools.length === 0) console.log("  (none)");
}).catch((e) => console.error("Error:", e.message));
