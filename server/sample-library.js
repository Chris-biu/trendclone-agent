const fs = require("node:fs");
const path = require("node:path");

const samplePath = path.join(__dirname, "..", "data", "sample-library.json");

function loadSampleLibrary() {
  const raw = fs.readFileSync(samplePath, "utf8");
  const samples = JSON.parse(raw);
  return samples.map((sample) => ({
    ...sample,
    highRiskElements: Array.isArray(sample.highRiskElements) ? sample.highRiskElements : [],
  }));
}

function sampleToAgentInputs(sample, overrides = {}) {
  return {
    link: sample.videoUrl || "",
    referenceText: [
      `开头钩子：${sample.openingHook}`,
      `叙事结构：${sample.narrativeStructure}`,
      `视觉风格：${sample.visualStyle}`,
      `节奏：${sample.pacing}`,
      `情绪触发：${sample.emotionTrigger}`,
      `可复刻结构：${sample.reusableStructure}`,
      `提示词模式：${sample.reusablePromptPattern}`,
      `高风险元素：${sample.highRiskElements.join("、")}`,
      `改编角度：${sample.adaptationAngle}`,
    ].join("\n"),
    goal: overrides.goal || sample.adaptationAngle,
    audience: overrides.audience || sample.targetAudience,
    platform: sample.platform,
    duration: sample.duration || 30,
    shotCount: "auto",
    similarity: overrides.similarity || 72,
  };
}

module.exports = {
  loadSampleLibrary,
  sampleToAgentInputs,
};
