const test = require("node:test");
const assert = require("node:assert/strict");

const { getModelStatus, normalizeClientModelConfig } = require("../server");

test("getModelStatus reports fallback mode without an API key", () => {
  const status = getModelStatus({});

  assert.equal(status.configured, false);
  assert.equal(status.mode, "local-fallback");
  assert.equal(status.model, "deepseek-chat");
});

test("getModelStatus reports configured OpenAI-compatible provider", () => {
  const status = getModelStatus({
    AI_API_KEY: "test-key",
    AI_API_BASE_URL: "https://api.example.com",
    AI_MODEL: "example-model",
  });

  assert.equal(status.configured, true);
  assert.equal(status.mode, "ai");
  assert.equal(status.baseUrl, "https://api.example.com");
  assert.equal(status.model, "example-model");
});

test("normalizeClientModelConfig maps browser form fields into runtime env", () => {
  const env = normalizeClientModelConfig({
    apiKey: " test-key ",
    baseUrl: "https://api.example.com/v1",
    model: "example-model",
  });

  assert.deepEqual(env, {
    AI_API_KEY: "test-key",
    AI_API_BASE_URL: "https://api.example.com/v1",
    AI_MODEL: "example-model",
  });
});

test("normalizeClientModelConfig rejects invalid base urls", () => {
  assert.throws(
    () =>
      normalizeClientModelConfig({
        apiKey: "test-key",
        baseUrl: "api.example.com",
        model: "example-model",
      }),
    /must start with/,
  );
});
