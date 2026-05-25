const test = require("node:test");
const assert = require("node:assert/strict");

const {
  loadSampleLibrary,
  sampleToAgentInputs,
} = require("../server/sample-library");

test("loadSampleLibrary returns complete sample records", () => {
  const samples = loadSampleLibrary();

  assert.ok(samples.length >= 6);
  for (const sample of samples) {
    assert.ok(sample.id);
    assert.ok(sample.platform);
    assert.ok(sample.title);
    assert.ok(sample.openingHook);
    assert.ok(sample.narrativeStructure);
    assert.ok(sample.reusableStructure);
    assert.ok(sample.highRiskElements.length >= 1);
  }
});

test("sampleToAgentInputs converts a sample into generate-ready inputs", () => {
  const sample = loadSampleLibrary()[0];
  const inputs = sampleToAgentInputs(sample, {
    goal: "一款 AI 视频作业工具",
    audience: "想做自媒体的大学生",
  });

  assert.equal(inputs.platform, sample.platform);
  assert.equal(inputs.goal, "一款 AI 视频作业工具");
  assert.equal(inputs.audience, "想做自媒体的大学生");
  assert.equal(inputs.shotCount, "auto");
  assert.ok(inputs.referenceText.includes(sample.openingHook));
  assert.ok(inputs.referenceText.includes(sample.reusableStructure));
});
