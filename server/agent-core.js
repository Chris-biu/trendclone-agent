const archetypes = [
  {
    name: "强反差开场",
    hook: "先展示一个夸张结果，再倒推过程",
    rhythm: "前 3 秒强结果，中段快切，结尾给用户一个简单动作",
    emotion: "惊讶、好奇、想要复现",
    reusable: "结构、节奏、结果对比",
    avoid: "原视频人物、音乐、完整台词、相同构图",
  },
  {
    name: "痛点到结果",
    hook: "把用户最烦的事情放在第一句话",
    rhythm: "痛点一句话，过程三步，结果一屏展示",
    emotion: "省事、效率、被理解",
    reusable: "痛点表达方式、三步解决结构",
    avoid: "复制原文案中的具体案例和品牌元素",
  },
  {
    name: "教程拆解型",
    hook: "直接告诉用户用一个方法做出同款效果",
    rhythm: "先给结果，再拆步骤，最后提醒保存",
    emotion: "可学、可操作、低门槛",
    reusable: "教学顺序、镜头节奏、结果展示方式",
    avoid: "照搬原作者专属素材和口头禅",
  },
];

const platformTones = {
  抖音: {
    title: "30 秒做出同款 AI 爆款感，原来关键不是工具",
    cta: "评论区告诉我你的选题，我帮你拆一个同款结构。",
    tags: ["AI视频", "短视频创作", "同款教程", "爆款拆解"],
  },
  小红书: {
    title: "我把一个爆款 AI 视频拆成了可复用模板",
    cta: "想要模板可以收藏，下一条我继续拆真实案例。",
    tags: ["AI创作", "自媒体干货", "视频脚本", "新媒体运营"],
  },
  视频号: {
    title: "普通人做 AI 视频，先学会拆结构",
    cta: "转发给正在做内容的朋友，一起把创意跑通。",
    tags: ["AI应用", "内容创作", "效率工具", "视频运营"],
  },
  "B 站": {
    title: "我用产品思维拆了一个 AI 视频爆款公式",
    cta: "三连后我会继续做完整复盘和工具链。",
    tags: ["AI教程", "AIGC", "产品分析", "短视频"],
  },
};

function cleanInputs(input = {}) {
  const platform = platformTones[input.platform] ? input.platform : "抖音";
  const duration = Number(input.duration) || 30;
  const similarity = Math.max(30, Math.min(90, Number(input.similarity) || 72));
  const shotCount = input.shotCount === "auto" ? "auto" : String(input.shotCount || "auto");

  return {
    fileName: String(input.fileName || ""),
    link: String(input.link || ""),
    referenceText: String(input.referenceText || ""),
    goal: String(input.goal || "一个 AI 视频创作工具"),
    audience: String(input.audience || "想提升短视频效率的创作者"),
    platform,
    duration,
    shotCount,
    similarity,
  };
}

function chooseArchetype(inputs) {
  const source = `${inputs.referenceText} ${inputs.goal}`.toLowerCase();
  if (source.includes("教程") || source.includes("拆解") || source.includes("方法")) return archetypes[2];
  if (source.includes("痛点") || source.includes("不会") || source.includes("效率")) return archetypes[1];
  return archetypes[0];
}

function inferShotPlan(inputs, archetype) {
  const text = `${inputs.referenceText} ${inputs.goal} ${inputs.audience}`.toLowerCase();
  const base = inputs.duration <= 15 ? 4 : inputs.duration <= 30 ? 6 : 8;
  const signals = [
    ["快切", "节奏快"],
    ["转场", "转场多"],
    ["对比", "需要前后对比"],
    ["教程", "教程步骤多"],
    ["步骤", "步骤表达多"],
    ["反转", "需要铺垫反转"],
    ["剧情", "叙事链路长"],
    ["字幕", "信息密度高"],
    ["产品", "需要展示产品价值"],
    ["过程", "需要展示过程证明"],
  ].filter(([keyword]) => text.includes(keyword));
  const platformBias = inputs.platform === "抖音" || inputs.platform === "小红书" ? 1 : 0;
  const similarityBias = inputs.similarity >= 78 ? 1 : 0;
  const archetypeBias = archetype.name === "教程拆解型" ? 1 : 0;
  const computed = base + Math.ceil(signals.length / 2) + platformBias + similarityBias + archetypeBias;
  const count = Math.max(4, Math.min(12, computed));
  const reasons = [
    `${inputs.duration} 秒基础节奏 ${base} 镜头`,
    signals.length ? `识别到${signals.slice(0, 3).map((item) => item[1]).join("、")}` : "内容复杂度较低",
    platformBias ? `${inputs.platform} 更适合快节奏切镜` : `${inputs.platform} 可保留更多讲解空间`,
  ];

  return {
    count,
    reason: reasons.join("；"),
  };
}

function buildFallbackPackage(rawInputs = {}) {
  const inputs = cleanInputs(rawInputs);
  const archetype = chooseArchetype(inputs);
  const platform = platformTones[inputs.platform];
  const inferredShotPlan = inferShotPlan(inputs, archetype);
  const shotCount = inputs.shotCount === "auto" ? inferredShotPlan.count : Number(inputs.shotCount);
  const shotReason = inputs.shotCount === "auto" ? inferredShotPlan.reason : "使用手动指定镜头数";
  const safety = Math.max(58, Math.min(92, 104 - inputs.similarity + (inputs.referenceText.length > 18 ? 7 : 0)));
  const difficulty = inputs.duration === 60 ? "中高" : inputs.similarity > 80 ? "中" : "低中";

  const breakdown = [
    {
      label: "开头钩子",
      title: archetype.hook,
      body: `参考内容可拆成“先给结果，再解释为什么”的开场。改编时建议把结果替换成「${inputs.goal}」的具体收益。`,
    },
    {
      label: "叙事节奏",
      title: archetype.rhythm,
      body: `适合 ${inputs.duration} 秒视频。每 3-5 秒给一次信息变化，避免长段讲解。`,
    },
    {
      label: "情绪价值",
      title: archetype.emotion,
      body: `目标人群是「${inputs.audience}」，重点让他们感觉这件事可复制、成本低、马上能试。`,
    },
    {
      label: "可复刻边界",
      title: archetype.reusable,
      body: `不要复用：${archetype.avoid}。建议只复用结构和节奏。`,
    },
  ];

  const script = [
    { time: "0-3s", text: "钩子：你以为做出这种 AI 爆款视频要很强的技术？其实先拆对结构就够了。" },
    { time: "3-8s", text: "展示：把参考视频拆成开头钩子、视觉冲击、过程证明和结尾行动四段。" },
    { time: "8-15s", text: `转入主题：现在把这个结构换成「${inputs.goal}」，画面和台词全部重写。` },
    { time: "15-24s", text: "结果展示：给出 3 个镜头成品预览，让用户看到同款节奏但不是同款内容。" },
    { time: inputs.duration > 30 ? "24-55s" : "24-30s", text: `CTA：${platform.cta}` },
  ];

  const shotTemplates = [
    ["强结果开场", "一个学生在电脑前看到 AI 视频成品，屏幕从空白快速变成电影感短片", "推近镜头，快速切到成品画面"],
    ["拆结构", "画面分成四栏：钩子、冲突、证明、行动，每一栏依次点亮", "屏幕录制或信息图动画"],
    ["换主题", `把原来的爆款主题替换成${inputs.goal}，旁边出现重写后的关键词`, "左右对比，旧主题虚化，新主题变清晰"],
    ["生成分镜", "一张分镜表从左到右展开，每格出现画面、旁白和字幕", "俯视工作台，纸张和屏幕结合"],
    ["成品预览", "三个不同风格的视频片段并排播放，统一节奏但画面元素不同", "快切蒙太奇"],
    ["风险提醒", "相似度滑杆下降，原创安全分上升，危险元素被划掉", "UI 动效，红色风险项转为绿色"],
    ["发布动作", "用户点击发布按钮，标题、封面和话题自动填入", "手机界面特写"],
    ["复盘结果", "数据面板显示完播率、评论率、收藏率三个指标", "简洁数据看板"],
    ["持续迭代", "多个版本 A/B/C 依次排列，最佳版本被选中", "横向卡片选择动画"],
    ["评论引导", "画面停在最强结果上，评论区问题逐条浮现", "手机评论区叠层动画"],
    ["收藏理由", "屏幕显示一张可收藏的四步公式卡片", "信息卡片从视频下方弹出"],
    ["下一条预告", "最后一秒出现下一条拆解案例的剪影和问题", "暗场转场，保留悬念"],
  ];

  const shots = shotTemplates.slice(0, shotCount).map((shot, index) => ({
    id: index + 1,
    title: shot[0],
    visual: shot[1],
    narration: script[Math.min(index, script.length - 1)].text,
    caption: index === 0 ? "爆款不是照抄，是拆结构" : index === shotCount - 1 ? "保存这个同款公式" : "换主题，保节奏，重写表达",
    prompt: `竖屏 9:16，${shot[1]}，${shot[2]}，干净真实的中文短视频质感，高对比但不过度夸张，避免出现知名品牌、真实名人和原视频专属元素。`,
  }));
  const scores = {
    similarity: `${inputs.similarity}%`,
    safety: `${safety}/100`,
    shots: `${shotCount}`,
    shotReason,
    difficulty,
  };
  const variants = buildVariants(inputs, platform);
  const evaluation = buildEvaluation(inputs, scores, shotCount);

  return {
    provider: "local-fallback",
    inputs,
    breakdown,
    script,
    shots,
    publish: {
      title: platform.title,
      cover: "同款爆款感，关键是这 4 段结构",
      body: `今天用「${inputs.goal}」复刻爆款视频的结构，不复制台词、不复用素材，只保留节奏和创意框架。${platform.cta}`,
      tags: platform.tags,
    },
    risk: [
      {
        level: "high",
        title: "高风险：直接复用画面、音乐或完整台词",
        body: "这些元素容易被识别为搬运或侵权。初版建议只输出替代表达，不提供原视频素材下载。",
      },
      {
        level: "medium",
        title: "中风险：构图和镜头顺序过度接近",
        body: `当前结构贴近度为 ${inputs.similarity}%。建议画面风格和人物设定至少替换 50%。`,
      },
      {
        level: "low",
        title: "低风险：复用叙事公式和节奏",
        body: "保留“钩子、过程、结果、行动”的结构，属于更适合产品化的原创改编方向。",
      },
    ],
    scores,
    variants,
    evaluation,
  };
}

function buildVariants(inputs, platform) {
  return [
    {
      id: "high_similarity",
      name: "高相似版",
      positioning: "最大程度保留参考视频的叙事顺序、切镜节奏和结果展示方式。",
      bestFor: "追热点、做同款挑战、验证爆款结构是否适合自己的主题。",
      tradeoff: "传播记忆点更接近参考视频，但原创安全分会下降，需要重写台词和画面元素。",
      changes: [
        "保留 0-3 秒强钩子结构",
        "保留中段快切和前后对比",
        `把核心内容替换为「${inputs.goal}」`,
      ],
    },
    {
      id: "low_risk",
      name: "低风险版",
      positioning: "只复用爆款的底层公式，重写叙事角度、视觉风格、人物设定和 CTA。",
      bestFor: "正式发布、品牌账号、需要降低搬运和侵权风险的内容。",
      tradeoff: "和参考视频的表层相似度降低，短期热点借势感会弱一些。",
      changes: [
        "改写开头钩子为用户痛点",
        "替换画面风格和人物设定",
        "不用原音乐、原台词、原构图",
      ],
    },
    {
      id: "platform_fit",
      name: "平台适配版",
      positioning: `按${inputs.platform}的内容节奏重排脚本、标题和互动引导。`,
      bestFor: `准备直接发布到${inputs.platform}，希望提升完播、收藏或评论互动。`,
      tradeoff: "平台特征更强，迁移到其他平台前需要重新改标题和节奏。",
      changes: [
        `${inputs.platform}标题：${platform.title}`,
        `评论/互动：${platform.cta}`,
        "封面强调可收藏的同款公式",
      ],
    },
  ];
}

function buildEvaluation(inputs, scores, shotCount) {
  const similarity = Number(String(scores.similarity).replace("%", "")) || inputs.similarity;
  const safety = Number(String(scores.safety).split("/")[0]) || 70;
  const platformFit = inputs.platform === "抖音" || inputs.platform === "小红书" ? 86 : 78;
  const promptUsability = Math.max(72, Math.min(92, 68 + shotCount * 2));
  const productionCost = inputs.duration >= 60 ? 66 : shotCount > 9 ? 72 : 82;
  const scriptReadiness = Math.max(70, Math.min(90, 94 - Math.abs(72 - similarity) / 2));

  return {
    summary: "当前方案适合先做脚本和分镜验证，再进入视频生成工具制作。发布前应优先改写画面元素、台词和音乐，避免被识别为搬运。",
    metrics: [
      { label: "结构复刻度", score: similarity, note: "衡量是否保留参考视频的钩子、节奏和叙事顺序。" },
      { label: "原创安全分", score: safety, note: "分数越高，越不像直接搬运；低于 70 需要继续改写。" },
      { label: "平台适配度", score: platformFit, note: `根据${inputs.platform}的节奏、标题和互动方式估算。` },
      { label: "提示词可用性", score: promptUsability, note: "衡量分镜提示词是否足够具体，能否交给视频生成工具。" },
      { label: "制作难度", score: productionCost, note: "分数越高越容易制作；镜头越多、时长越长，制作成本越高。" },
      { label: "脚本可发布度", score: scriptReadiness, note: "衡量脚本是否有完整开头、过程、结果和行动引导。" },
    ],
  };
}

function normalizeArray(value, fallback) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function normalizeAgentPackage(modelOutput, rawInputs = {}, provider = "model") {
  const fallback = buildFallbackPackage(rawInputs);
  const source = modelOutput && typeof modelOutput === "object" ? modelOutput : {};
  const inputs = cleanInputs(rawInputs);
  const shots = normalizeArray(source.shots, fallback.shots).map((shot, index) => ({
    id: index + 1,
    title: String(shot.title || fallback.shots[Math.min(index, fallback.shots.length - 1)].title),
    visual: String(shot.visual || fallback.shots[Math.min(index, fallback.shots.length - 1)].visual),
    narration: String(shot.narration || fallback.shots[Math.min(index, fallback.shots.length - 1)].narration),
    caption: String(shot.caption || fallback.shots[Math.min(index, fallback.shots.length - 1)].caption),
    prompt: String(shot.prompt || fallback.shots[Math.min(index, fallback.shots.length - 1)].prompt),
  }));
  const variants = normalizeArray(source.variants, fallback.variants).map((variant, index) => {
    const fallbackVariant = fallback.variants[Math.min(index, fallback.variants.length - 1)];
    return {
      id: String(variant.id || fallbackVariant.id),
      name: String(variant.name || fallbackVariant.name),
      positioning: String(variant.positioning || fallbackVariant.positioning),
      bestFor: String(variant.bestFor || fallbackVariant.bestFor),
      tradeoff: String(variant.tradeoff || fallbackVariant.tradeoff),
      changes: normalizeArray(variant.changes, fallbackVariant.changes).map(String),
    };
  });
  const metrics = normalizeArray(source.evaluation?.metrics, fallback.evaluation.metrics).map((metric, index) => {
    const fallbackMetric = fallback.evaluation.metrics[Math.min(index, fallback.evaluation.metrics.length - 1)];
    const score = Number(metric.score);
    return {
      label: String(metric.label || fallbackMetric.label),
      score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : fallbackMetric.score,
      note: String(metric.note || fallbackMetric.note),
    };
  });

  return {
    provider,
    inputs,
    breakdown: normalizeArray(source.breakdown, fallback.breakdown).map((item) => ({
      label: String(item.label || "分析维度"),
      title: String(item.title || "结构判断"),
      body: String(item.body || "该维度需要继续补充。"),
    })),
    script: normalizeArray(source.script, fallback.script).map((item) => ({
      time: String(item.time || "0-3s"),
      text: String(item.text || "展示主题和结果。"),
    })),
    shots,
    publish: {
      title: String(source.publish?.title || fallback.publish.title),
      cover: String(source.publish?.cover || fallback.publish.cover),
      body: String(source.publish?.body || fallback.publish.body),
      tags: normalizeArray(source.publish?.tags, fallback.publish.tags).map(String),
    },
    risk: normalizeArray(source.risk, fallback.risk).map((item) => ({
      level: ["high", "medium", "low"].includes(item.level) ? item.level : "medium",
      title: String(item.title || "相似度风险"),
      body: String(item.body || "需要改写画面、台词和素材，避免直接复用参考视频元素。"),
    })),
    scores: {
      similarity: String(source.scores?.similarity || fallback.scores.similarity),
      safety: String(source.scores?.safety || fallback.scores.safety),
      shots: String(source.scores?.shots || shots.length),
      shotReason: String(source.scores?.shotReason || fallback.scores.shotReason),
      difficulty: String(source.scores?.difficulty || fallback.scores.difficulty),
    },
    variants,
    evaluation: {
      summary: String(source.evaluation?.summary || fallback.evaluation.summary),
      metrics,
    },
  };
}

function buildModelPrompt(inputs) {
  const cleaned = cleanInputs(inputs);
  return [
    "你是 TrendClone Agent，一个短视频爆款结构拆解与原创改编产品。",
    "任务：根据用户提供的爆款参考信息和改编目标，生成同款原创创意包。",
    "边界：不要帮助用户搬运、复用原视频音乐、完整台词、人物/IP/品牌。只复用结构、节奏和创意公式。",
    "必须只返回 JSON，不要 Markdown，不要代码块。",
    "JSON 字段必须包含：breakdown, script, shots, publish, risk, scores, variants, evaluation。",
    "shots 每项包含 title, visual, narration, caption, prompt。",
    "variants 必须给出 high_similarity、low_risk、platform_fit 三个方案，每项包含 id, name, positioning, bestFor, tradeoff, changes。",
    "evaluation.metrics 必须包含 6 个指标：结构复刻度、原创安全分、平台适配度、提示词可用性、制作难度、脚本可发布度；score 为 0-100 数字。",
    "risk 的 level 只能是 high, medium, low。",
    `用户输入：${JSON.stringify(cleaned, null, 2)}`,
  ].join("\n");
}

function parseModelJson(text) {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("Model returned empty content");
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model response did not contain a JSON object");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

async function generateWithOpenAICompatible(inputs, env = process.env) {
  if (!env.AI_API_KEY) {
    return buildFallbackPackage(inputs);
  }

  const baseUrl = (env.AI_API_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const model = env.AI_MODEL || "deepseek-chat";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "你是严谨的 AI Agent 产品生成器，只输出合法 JSON。" },
        { role: "user", content: buildModelPrompt(inputs) },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI provider error ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  const parsed = parseModelJson(content);
  return normalizeAgentPackage(parsed, inputs, model);
}

module.exports = {
  buildFallbackPackage,
  buildModelPrompt,
  generateWithOpenAICompatible,
  inferShotPlan,
  normalizeAgentPackage,
  parseModelJson,
};
