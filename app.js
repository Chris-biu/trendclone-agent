const $ = (selector) => document.querySelector(selector);

const state = {
  lastPackage: null,
  videoFileName: "",
  activeVariantId: "high_similarity",
  samples: [],
};

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

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function getInputs() {
  return {
    fileName: state.videoFileName,
    link: $("#referenceLink").value.trim(),
    referenceText: $("#referenceText").value.trim(),
    goal: $("#goal").value.trim(),
    audience: $("#audience").value.trim(),
    platform: $("#platform").value,
    duration: Number($("#duration").value),
    shotCount: $("#shotCount").value,
    similarity: Number($("#similarity").value),
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

function buildPackage(inputs) {
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
      body: `参考内容可拆成“先给结果，再解释为什么”的开场。改编时建议把结果替换成「${inputs.goal || "你的主题"}」的具体收益。`,
    },
    {
      label: "叙事节奏",
      title: archetype.rhythm,
      body: `适合 ${inputs.duration} 秒视频。每 3-5 秒给一次信息变化，避免长段讲解。`,
    },
    {
      label: "情绪价值",
      title: archetype.emotion,
      body: `目标人群是「${inputs.audience || "目标用户"}」，重点让他们感觉这件事可复制、成本低、马上能试。`,
    },
    {
      label: "可复刻边界",
      title: archetype.reusable,
      body: `不要复用：${archetype.avoid}。建议只复用结构和节奏。`,
    },
  ];

  const script = [
    {
      time: "0-3s",
      text: `钩子：你以为做出这种 AI 爆款视频要很强的技术？其实先拆对结构就够了。`,
    },
    {
      time: "3-8s",
      text: `展示：把参考视频拆成开头钩子、视觉冲击、过程证明和结尾行动四段。`,
    },
    {
      time: "8-15s",
      text: `转入主题：现在把这个结构换成「${inputs.goal || "你的产品或主题"}」，画面和台词全部重写。`,
    },
    {
      time: "15-24s",
      text: `结果展示：给出 3 个镜头成品预览，让用户看到同款节奏但不是同款内容。`,
    },
    {
      time: `${inputs.duration > 30 ? "24-55s" : "24-30s"}`,
      text: `CTA：${platform.cta}`,
    },
  ];

  const shotTemplates = [
    ["强结果开场", `一个学生在电脑前看到 AI 视频成品，屏幕从空白快速变成电影感短片`, "推近镜头，快速切到成品画面"],
    ["拆结构", `画面分成四栏：钩子、冲突、证明、行动，每一栏依次点亮`, "屏幕录制或信息图动画"],
    ["换主题", `把原来的爆款主题替换成${inputs.goal || "你的主题"}，旁边出现重写后的关键词`, "左右对比，旧主题虚化，新主题变清晰"],
    ["生成分镜", `一张分镜表从左到右展开，每格出现画面、旁白和字幕`, "俯视工作台，纸张和屏幕结合"],
    ["成品预览", `三个不同风格的视频片段并排播放，统一节奏但画面元素不同`, "快切蒙太奇"],
    ["风险提醒", `相似度滑杆下降，原创安全分上升，危险元素被划掉`, "UI 动效，红色风险项转为绿色"],
    ["发布动作", `用户点击发布按钮，标题、封面和话题自动填入`, "手机界面特写"],
    ["复盘结果", `数据面板显示完播率、评论率、收藏率三个指标`, "简洁数据看板"],
    ["持续迭代", `多个版本 A/B/C 依次排列，最佳版本被选中`, "横向卡片选择动画"],
    ["评论引导", `画面停在最强结果上，评论区问题逐条浮现`, "手机评论区叠层动画"],
    ["收藏理由", `屏幕显示一张可收藏的四步公式卡片`, "信息卡片从视频下方弹出"],
    ["下一条预告", `最后一秒出现下一条拆解案例的剪影和问题`, "暗场转场，保留悬念"],
  ];

  const shots = shotTemplates.slice(0, shotCount).map((shot, index) => ({
    id: index + 1,
    title: shot[0],
    visual: shot[1],
    narration: script[Math.min(index, script.length - 1)].text,
    caption: index === 0 ? "爆款不是照抄，是拆结构" : index === shotCount - 1 ? "保存这个同款公式" : "换主题，保节奏，重写表达",
    prompt: `竖屏 9:16，${shot[1]}，${shot[2]}，干净真实的中文短视频质感，高对比但不过度夸张，避免出现知名品牌、真实名人和原视频专属元素。`,
  }));

  return {
    inputs,
    breakdown,
    script,
    shots,
    publish: {
      title: platform.title,
      cover: "同款爆款感，关键是这 4 段结构",
      body: `今天用「${inputs.goal || "一个新主题"}」复刻爆款视频的结构，不复制台词、不复用素材，只保留节奏和创意框架。${platform.cta}`,
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
    scores: {
      similarity: `${inputs.similarity}%`,
      safety: `${safety}/100`,
      shots: `${shotCount}`,
      shotReason,
      difficulty,
    },
  };
}

function renderBreakdown(items) {
  $("#breakdown").className = "breakdown breakdown-grid";
  $("#breakdown").innerHTML = items
    .map(
      (item) => `
        <article class="insight-card">
          <span>${item.label}</span>
          <strong>${item.title}</strong>
          <p>${item.body}</p>
        </article>
      `,
    )
    .join("");
}

function renderScript(items) {
  $("#scriptOutput").className = "script-output";
  $("#scriptOutput").innerHTML = `
    <ul class="script-list">
      ${items
        .map(
          (item) => `
            <li>
              <strong>${item.time}</strong>
              <p>${item.text}</p>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderStoryboard(shots) {
  $("#storyboard").className = "storyboard";
  $("#storyboard").innerHTML = shots
    .map(
      (shot) => `
        <article class="shot-card">
          <div class="shot-visual">镜头 ${shot.id}<br>${shot.title}</div>
          <div class="shot-body">
            <span>画面</span>
            <p>${shot.visual}</p>
            <span>字幕</span>
            <p>${shot.caption}</p>
            <span>AI 视频提示词</span>
            <div class="prompt-box">${shot.prompt}</div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderVariants(variants = []) {
  const safeVariants = variants.length ? variants : [
    {
      id: "high_similarity",
      name: "高相似版",
      positioning: "保留参考视频结构和节奏。",
      bestFor: "追热点。",
      tradeoff: "需要控制原创风险。",
      changes: ["保留结构", "重写台词", "替换画面"],
    },
  ];
  $("#variantOutput").className = "variant-output";
  $("#variantOutput").innerHTML = safeVariants
    .map(
      (variant) => `
        <button class="variant-card ${variant.id === state.activeVariantId ? "active" : ""}" type="button" data-variant-id="${variant.id}">
          <span>${variant.name}</span>
          <strong>${variant.positioning}</strong>
          <p><b>适合：</b>${variant.bestFor}</p>
          <p><b>取舍：</b>${variant.tradeoff}</p>
          <ul>${(variant.changes || []).map((change) => `<li>${change}</li>`).join("")}</ul>
        </button>
      `,
    )
    .join("");
  document.querySelectorAll("[data-variant-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeVariantId = button.dataset.variantId;
      renderVariants(state.lastPackage?.variants || safeVariants);
      showToast(`已选择：${button.querySelector("span").textContent}`);
    });
  });
}

function renderVideoPreview(result, simulated = false) {
  const leadShot = result.shots[0];
  $("#videoPreview").className = "video-preview";
  $("#videoPreview").innerHTML = `
    <div class="phone-frame" aria-label="竖屏成片预览">
      <div class="mock-video">
        <div class="video-scene">
          <span>AI</span>
          <strong>${result.inputs.platform}</strong>
          <em>${result.scores.similarity}</em>
        </div>
        <div class="subtitle-band">${leadShot.caption}</div>
        <h4>${simulated ? "已模拟合成" : "待合成预览"}</h4>
        <p>${result.publish.title}</p>
        <div class="progress-bar"><i style="width: ${simulated ? "100" : "34"}%"></i></div>
      </div>
    </div>
    <div class="video-plan">
      ${result.shots
        .slice(0, 6)
        .map(
          (shot) => `
            <article class="video-step">
              <span class="step-index">${shot.id}</span>
              <div>
                <strong>${shot.title}</strong>
                <p>${shot.visual}</p>
              </div>
              <span class="step-status">${simulated ? "完成" : "待生成"}</span>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderPublish(publish) {
  $("#publishOutput").className = "publish-output";
  $("#publishOutput").innerHTML = `
    <div class="publish-card">
      <strong>${publish.title}</strong>
      <p>封面：${publish.cover}</p>
      <p>${publish.body}</p>
      <div class="tag-row">${publish.tags.map((tag) => `<span>#${tag}</span>`).join("")}</div>
    </div>
  `;
}

function renderRisk(risks) {
  $("#riskOutput").className = "risk-output risk-list";
  $("#riskOutput").innerHTML = risks
    .map(
      (risk) => `
        <article class="risk-item ${risk.level}">
          <span>${risk.level === "high" ? "必须规避" : risk.level === "medium" ? "需要改写" : "可保留"}</span>
          <p><strong>${risk.title}</strong></p>
          <p>${risk.body}</p>
        </article>
      `,
    )
    .join("");
}

function renderEvaluation(evaluation) {
  if (!evaluation || !Array.isArray(evaluation.metrics)) {
    $("#evaluationOutput").className = "evaluation-output empty-state";
    $("#evaluationOutput").innerHTML = "<p>暂无评测数据。</p>";
    return;
  }
  $("#evaluationOutput").className = "evaluation-output";
  $("#evaluationOutput").innerHTML = `
    <p class="evaluation-summary">${evaluation.summary}</p>
    <div class="evaluation-grid">
      ${evaluation.metrics
        .map((metric) => {
          const score = Math.max(0, Math.min(100, Number(metric.score) || 0));
          return `
            <article class="metric-card">
              <header>
                <strong>${metric.label}</strong>
                <span>${score}</span>
              </header>
              <div class="metric-bar"><i style="width: ${score}%"></i></div>
              <p>${metric.note}</p>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderScores(scores) {
  $("#scoreSimilarity").textContent = scores.similarity;
  $("#scoreSafety").textContent = scores.safety;
  $("#scoreShots").textContent = scores.shots;
  $("#scoreShotReason").textContent = scores.shotReason;
  $("#scoreDifficulty").textContent = scores.difficulty;
}

async function requestAgentPackage(inputs) {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    });
    if (!response.ok) {
      throw new Error(`API request failed with ${response.status}`);
    }
    const payload = await response.json();
    if (!payload.ok || !payload.data) {
      throw new Error(payload.error || "API returned an invalid payload");
    }
    return payload.data;
  } catch (error) {
    const fallback = buildPackage(inputs);
    fallback.provider = "browser-fallback";
    fallback.warning = error.message;
    return fallback;
  }
}

async function generate() {
  const inputs = getInputs();
  if (!inputs.goal) {
    showToast("请先填写你要推广的产品、账号或主题。");
    $("#goal").focus();
    return;
  }

  $("#agentStatus").textContent = "生成中";
  $(".nav-status").classList.remove("ready");

  try {
    const result = await requestAgentPackage(inputs);
    state.lastPackage = result;
    state.activeVariantId = result.variants?.[0]?.id || "high_similarity";
    renderScores(result.scores);
    renderVariants(result.variants);
    renderBreakdown(result.breakdown);
    renderScript(result.script);
    renderStoryboard(result.shots);
    renderVideoPreview(result);
    renderPublish(result.publish);
    renderRisk(result.risk);
    renderEvaluation(result.evaluation);
    const providerLabel = result.provider && result.provider !== "local-fallback" && result.provider !== "browser-fallback" ? result.provider : "本地回退";
    $("#agentStatus").textContent = `已生成 · ${providerLabel}`;
    $(".nav-status").classList.add("ready");
    switchView("strategy");
    showToast(result.warning ? `已使用本地回退：${result.warning}` : "同款创意包已生成，可继续调整相似度和平台。");
  } catch (error) {
    $("#agentStatus").textContent = "生成失败";
    showToast(`生成失败：${error.message}`);
  }
}

function copyReport() {
  if (!state.lastPackage) {
    showToast("请先生成创意包。");
    return;
  }
  const report = [
    "TrendClone Agent 创意包",
    "",
    "爆款拆解：",
    ...state.lastPackage.breakdown.map((item) => `- ${item.label}: ${item.title}。${item.body}`),
    "",
    "脚本：",
    ...state.lastPackage.script.map((item) => `- ${item.time}: ${item.text}`),
    "",
    "发布标题：",
    state.lastPackage.publish.title,
  ].join("\n");

  navigator.clipboard
    .writeText(report)
    .then(() => showToast("报告已复制到剪贴板。"))
    .catch(() => showToast("当前浏览器不允许复制，请手动选择内容。"));
}

function exportJson() {
  if (!state.lastPackage) {
    showToast("请先生成创意包。");
    return;
  }
  const blob = new Blob([JSON.stringify(state.lastPackage, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "trendclone-creative-package.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("JSON 制作包已导出。");
}

function simulateVideo() {
  if (!state.lastPackage) {
    showToast("请先生成创意包。");
    return;
  }
  $("#agentStatus").textContent = "模拟合成中";
  $(".nav-status").classList.remove("ready");
  window.setTimeout(() => {
    renderVideoPreview(state.lastPackage, true);
    $("#agentStatus").textContent = "已生成预览";
    $(".nav-status").classList.add("ready");
    showToast("已完成模拟合成。真实 MP4 版本需要接视频生成 API 和合成服务。");
  }, 650);
}

function switchView(view) {
  document.querySelectorAll("[data-view-section]").forEach((section) => {
    section.classList.toggle("active", section.dataset.viewSection === view);
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function initNavigation() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
}

async function loadSampleLibrary() {
  try {
    const response = await fetch("./data/sample-library.json");
    if (!response.ok) throw new Error(`sample library ${response.status}`);
    state.samples = await response.json();
    renderSampleLibrary(state.samples);
    renderReportView(state.samples);
  } catch (error) {
    $("#sampleLibrary").className = "sample-library empty-state";
    $("#sampleLibrary").innerHTML = `<p>样本库加载失败：${error.message}</p>`;
  }
}

function renderSampleLibrary(samples) {
  $("#sampleCount").textContent = `${samples.length} 条样本`;
  $("#sampleLibrary").className = "sample-library";
  $("#sampleLibrary").innerHTML = samples
    .map(
      (sample) => `
        <article class="sample-card">
          <header>
            <span>${sample.platform} · ${sample.topicCategory}</span>
            <strong>${sample.title}</strong>
            <div class="sample-meta">
              <b>${sample.duration}s</b>
              <b>${sample.pacing}</b>
              <b>${sample.cloneDifficulty}</b>
            </div>
          </header>
          <p><b>钩子：</b>${sample.openingHook}</p>
          <p><b>结构：</b>${sample.narrativeStructure}</p>
          <p><b>可复刻：</b>${sample.reusableStructure}</p>
          <button type="button" data-sample-id="${sample.id}">套用这个样本</button>
        </article>
      `,
    )
    .join("");
  document.querySelectorAll("[data-sample-id]").forEach((button) => {
    button.addEventListener("click", () => applySample(button.dataset.sampleId));
  });
}

function applySample(sampleId) {
  const sample = state.samples.find((item) => item.id === sampleId);
  if (!sample) return;
  $("#referenceLink").value = "";
  $("#referenceText").value = [
    `开头钩子：${sample.openingHook}`,
    `叙事结构：${sample.narrativeStructure}`,
    `视觉风格：${sample.visualStyle}`,
    `节奏：${sample.pacing}`,
    `情绪触发：${sample.emotionTrigger}`,
    `可复刻结构：${sample.reusableStructure}`,
    `提示词模式：${sample.reusablePromptPattern}`,
    `高风险元素：${sample.highRiskElements.join("、")}`,
    `改编角度：${sample.adaptationAngle}`,
  ].join("\n");
  $("#goal").value = sample.adaptationAngle;
  $("#audience").value = sample.targetAudience;
  $("#platform").value = sample.platform;
  $("#duration").value = sample.duration > 45 ? "60" : sample.duration > 20 ? "30" : "15";
  $("#shotCount").value = "auto";
  switchView("setup");
  showToast(`已套用样本：${sample.title}`);
}

function renderReportView(samples) {
  const platforms = new Set(samples.map((sample) => sample.platform));
  const categories = new Set(samples.map((sample) => sample.topicCategory));
  const avgDuration = Math.round(samples.reduce((sum, sample) => sum + Number(sample.duration || 0), 0) / Math.max(samples.length, 1));
  const formulas = [
    "结果先行：先给成片效果，再解释过程",
    "前后对比：用普通素材和 AI 成品制造反差",
    "三步教程：把复杂创作压缩成可保存步骤",
    "平台适配：根据发布平台重排标题、节奏和 CTA",
  ];
  $("#reportView").innerHTML = `
    <div class="report-grid">
      <article class="report-card"><strong>${samples.length}</strong><span>样本数量</span></article>
      <article class="report-card"><strong>${platforms.size}</strong><span>覆盖平台</span></article>
      <article class="report-card"><strong>${categories.size}</strong><span>内容类型</span></article>
      <article class="report-card"><strong>${avgDuration}s</strong><span>平均时长</span></article>
    </div>
    <ul class="report-list">
      ${formulas.map((formula) => `<li>${formula}</li>`).join("")}
    </ul>
  `;
}

$("#similarity").addEventListener("input", (event) => {
  $("#similarityValue").textContent = `${event.target.value}%`;
});

$("#videoFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  state.videoFileName = file.name;
  const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
  $("#fileStatus").textContent = `${file.name} · ${size}`;
});

$("#generateBtn").addEventListener("click", generate);
$("#copyReport").addEventListener("click", copyReport);
$("#exportJson").addEventListener("click", exportJson);
$("#simulateVideo").addEventListener("click", simulateVideo);

initNavigation();
loadSampleLibrary();
generate();
