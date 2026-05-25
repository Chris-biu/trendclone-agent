const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildFallbackPackage,
  normalizeAgentPackage,
} = require("../server/agent-core");

test("buildFallbackPackage returns a complete creative package with dynamic shot count", () => {
  const result = buildFallbackPackage({
    referenceText: "开头强反差，节奏很快，有大量快切和转场，中段做前后对比，最后用教程步骤解释过程。",
    goal: "一款帮助大学生做 AI 视频作业的工具",
    audience: "想做自媒体但不会写脚本的大学生",
    platform: "抖音",
    duration: 30,
    shotCount: "auto",
    similarity: 72,
  });

  assert.equal(result.provider, "local-fallback");
  assert.equal(result.scores.shots, "11");
  assert.equal(result.shots.length, 11);
  assert.ok(result.scores.shotReason.includes("节奏快"));
  assert.ok(result.breakdown.length >= 4);
  assert.ok(result.script.length >= 5);
  assert.ok(result.publish.title.length > 0);
  assert.ok(result.risk.length >= 3);
  assert.equal(result.variants.length, 3);
  assert.deepEqual(
    result.variants.map((variant) => variant.id),
    ["high_similarity", "low_risk", "platform_fit"],
  );
  assert.equal(result.evaluation.metrics.length, 6);
  assert.ok(result.evaluation.summary.length > 0);
});

test("normalizeAgentPackage repairs model output into the required schema", () => {
  const result = normalizeAgentPackage(
    {
      breakdown: [{ label: "钩子", title: "先给结果", body: "用结果吸引用户。" }],
      script: [{ time: "0-3s", text: "先展示成片。" }],
      shots: [
        {
          title: "结果开场",
          visual: "展示 AI 视频成品",
          caption: "先看结果",
          prompt: "竖屏 9:16，展示 AI 视频成品",
        },
      ],
      publish: {
        title: "一个 AI 视频同款公式",
        cover: "先拆结构",
        body: "不照搬，只复用结构。",
        tags: ["AI视频"],
      },
      risk: [{ level: "low", title: "结构复用", body: "低风险。" }],
      scores: {
        similarity: "72%",
        safety: "82/100",
        shots: "1",
        shotReason: "模型判断需要 1 个核心镜头",
        difficulty: "低",
      },
      variants: [
        {
          id: "high_similarity",
          name: "高相似版",
          positioning: "保留节奏",
          bestFor: "追热点",
          tradeoff: "风险更高",
          changes: ["保留结构"],
        },
      ],
      evaluation: {
        summary: "整体可用",
        metrics: [{ label: "结构复刻度", score: 88, note: "结构清晰" }],
      },
    },
    {
      goal: "AI 视频工具",
      platform: "抖音",
      duration: 15,
      shotCount: "auto",
      similarity: 72,
    },
    "test-model",
  );

  assert.equal(result.provider, "test-model");
  assert.equal(result.shots[0].id, 1);
  assert.equal(result.publish.tags[0], "AI视频");
  assert.equal(result.scores.shots, "1");
  assert.equal(result.inputs.goal, "AI 视频工具");
  assert.equal(result.variants.length, 1);
  assert.equal(result.variants[0].id, "high_similarity");
  assert.equal(result.evaluation.metrics[0].score, 88);
});
