// One-time provisioning script: creates the ElevenLabs agent and prints the agent_id
require("dotenv").config();

const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const { buildAgentConfig } = require("../src/agentConfig");

async function main() {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.error("Error: BACKEND_URL is not set in .env");
    process.exit(1);
  }

  const elevenlabs = new ElevenLabsClient();
  const agent = await elevenlabs.conversationalAi.agents.create(
    buildAgentConfig(backendUrl)
  );

  const agentId = agent.agentId;
  console.log(`\nAgent created successfully!`);
  console.log(`Agent ID: ${agentId}`);
  console.log(`\nAdd the following to your .env file:`);
  console.log(`AGENT_ID=${agentId}`);
}

main().catch((err) => {
  console.error("Failed to create agent:", err.message);
  process.exit(1);
});
