const request = require("supertest");

// Prevent the ElevenLabs client from failing on missing API key during tests
jest.mock("@elevenlabs/elevenlabs-js", () => ({
  ElevenLabsClient: jest.fn().mockImplementation(() => ({
    conversationalAi: {
      conversations: {
        getSignedUrl: jest.fn().mockResolvedValue({ signedUrl: "wss://mock" }),
      },
    },
  })),
}));

const { app } = require("../server");

describe("POST /api/define", () => {
  test("returns 400 when word is missing", async () => {
    const res = await request(app).post("/api/define").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("returns 400 when parameters.word is empty", async () => {
    const res = await request(app)
      .post("/api/define")
      .send({ parameters: { word: "   " } });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
