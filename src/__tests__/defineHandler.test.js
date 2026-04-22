const { defineWord } = require("../defineHandler");

describe("defineWord", () => {
  test("throws on empty input", async () => {
    await expect(defineWord("")).rejects.toThrow("word parameter is required");
    await expect(defineWord("   ")).rejects.toThrow("word parameter is required");
  });

  test("returns { result } object with not-found message on 404", async () => {
    // Mock global fetch to return a 404
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      status: 404,
      json: async () => ({ title: "No Definitions Found" }),
    });

    const result = await defineWord("xyzzy");
    expect(result).toHaveProperty("result");
    expect(typeof result.result).toBe("string");
    expect(result.result.length).toBeGreaterThan(0);

    global.fetch = originalFetch;
  });
});
