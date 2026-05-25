# TrendClone Agent

TrendClone Agent 是一个面向 AI 视频创作者、短视频运营和小商家的爆款视频结构复刻与原创改编工具。

用户上传或描述一个爆款参考视频，再输入自己的产品、账号或主题，系统会生成可制作的同款原创创意包，包括爆款结构拆解、短视频脚本、动态分镜、AI 视频提示词、发布文案、成片预览和原创风险提示。

## 项目定位

这个项目不是做“视频搬运工具”，而是做“爆款结构迁移工具”：

```text
爆款参考输入
-> Agent 结构拆解
-> 同款原创改编
-> 动态分镜规划
-> AI 视频提示词
-> 发布文案
-> 原创风险检测
-> 成片预览/导出制作包
```

它更适合作为 AI Agent 产品经理实习作品集项目，重点展示：

- 对 AI 视频创作场景的理解
- Agent 工作流设计
- 用户输入/输出设计
- 动态镜头规划逻辑
- 原创风险控制
- 产品 PRD、竞品分析和样本库方法

## 当前功能

- 上传参考视频或粘贴视频链接入口
- 输入改编目标、目标人群、平台、视频时长
- 电影感多页面工作台：暗场监看室、胶片条、时间线、分区导航和产品自审面板
- AI 自动判断镜头数量
- 调节结构贴近度
- 生成爆款结构拆解
- 生成同款原创脚本
- 生成分镜和 AI 视频提示词
- 生成发布标题、封面文案、话题标签
- 输出原创风险检测
- 输出三种创意方案：高相似版、低风险版、平台适配版
- 输出 Agent 评测面板：结构复刻度、原创安全分、平台适配度、提示词可用性、制作难度、脚本可发布度
- 多页面 UI：工作台、样本库、视觉素材、评测报告、项目文档
- 内置 AI 爆款视频样本库，支持一键套用样本到生成流程
- 样本详情页：展示钩子、叙事结构、视觉风格、可复用公式、风险元素和改编方向
- 大模型接入状态页内提示：自动识别当前是真实模型、网页 API 配置还是本地回退模式
- 网页内 API 配置：可在创作设置页填写 API Key、Base URL 和模型名称，生成时优先使用网页配置
- 视觉素材页：沉淀主视觉、预览图、样本缩略图和空状态插画的 AI 生成提示词
- 工业自审页：从美术层次、效能体验、功能完整度和上线缺口四个维度审查产品成熟度
- 模拟成片预览和镜头合成队列
- 复制报告
- 导出 JSON 制作包

## 本地运行

这是一个零依赖 Node + 静态前端 Demo，不需要安装 npm 包。

方式一：运行带 API 的本地服务：

```powershell
node server.js
```

然后访问：

```text
http://127.0.0.1:5179
```

方式二：只看静态前端：

```powershell
py -m http.server 5179
```

如果没有配置 API Key，服务端会自动使用本地回退生成器，保证 Demo 可以正常演示。

页面加载不会自动调用生成接口，避免在已配置网页 API Key 后无意消耗额度。需要生成时点击“生成创意包”或创作设置页右上角“生成”按钮。

## 大模型配置

项目使用 OpenAI-compatible Chat Completions 接口。复制 `.env.example` 为 `.env`，填入自己的模型服务：

```text
AI_API_KEY=你的 API Key
AI_API_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat
PORT=5179
```

不填写 `AI_API_KEY` 时，系统会使用本地规则生成器。这个回退模式适合演示 UI 和产品流程；填写后，`/api/generate` 会请求真实大模型，并把模型输出规范化为稳定 JSON Schema。

也可以直接在网页的「创作设置」里填写 API Key、API Base URL 和模型名称。网页配置会保存在当前浏览器的 `localStorage`，生成时优先使用网页配置；清除网页配置后才会回到 `.env` 或本地回退模式。

前端会通过 `/api/model-status` 显示当前 `.env` 模型接入状态：

- `已连接真实大模型`：检测到 `AI_API_KEY`，生成时会调用 OpenAI-compatible 接口。
- `本地回退模式`：未检测到 `AI_API_KEY`，仍可完整演示产品流程。
- `网页 API 已配置`：当前浏览器已保存 API Key，生成时会优先使用网页输入的配置。

注意：网页输入 API Key 只适合本地 Demo。不要把 API Key 截图、提交到 GitHub，或部署到公开服务器给多人共用。

当前 JSON Schema 包含：

- `breakdown`：爆款结构拆解
- `script`：短视频脚本
- `shots`：分镜和 AI 视频提示词
- `publish`：发布文案
- `risk`：原创风险检测
- `scores`：核心评分
- `variants`：高相似版、低风险版、平台适配版
- `evaluation`：6 项 Agent 输出质量评测

## 项目结构

```text
.
├── index.html
├── styles.css
├── app.js
├── server.js
├── package.json
├── .env.example
├── server
│   └── agent-core.js
│   └── sample-library.js
├── tests
│   └── agent-core.test.js
│   └── sample-library.test.js
├── docs
│   ├── trendclone-prd.md
│   ├── competitor-analysis.md
│   ├── evaluation-report.md
│   └── visual-asset-prompts.md
├── data
│   ├── sample-library.json
│   └── video-sample-library-template.csv
└── trendclone-mvp-final.png
```

## 产品文档

- `docs/trendclone-prd.md`：产品需求文档，包含用户、场景、功能、指标、V1/V2/V3 规划。
- `docs/competitor-analysis.md`：竞品分析，覆盖剪映/CapCut、可灵/Kling、Runway、即梦等工具。
- `data/video-sample-library-template.csv`：AI 爆款视频样本库模板。

## 当前限制

当前版本是 V2 初版：

- 已支持 OpenAI-compatible 大模型接口，但需要用户自行配置 API Key。
- 上传视频暂时只读取文件信息，不做真实内容解析。
- 成片预览是模拟结果，不输出真实 MP4。
- 无 API Key 时，分镜、脚本和提示词由本地回退生成器生成。
- 当前已达到作品集演示标准，但距离真实商业上线仍需要补齐账号、历史记录、任务持久化、视频解析和视频合成服务。

## 后续规划

V2：

- 自动抽取视频关键帧。
- OCR 识别画面文字。
- ASR 识别旁白和字幕。
- 支持高相似版、低风险版、平台适配版三种创意方案。

V3：

- 接入 Runway、Kling/可灵或其他视频生成 API。
- 用 FFmpeg 拼接视频片段。
- 自动合成字幕、旁白和背景音乐。
- 导出完整竖屏 MP4。

## 简历描述示例

独立设计并开发 TrendClone Agent，面向 AI 视频创作者的爆款视频结构复刻与原创改编工具，支持参考视频输入、爆款结构拆解、动态镜头规划、同款原创脚本生成、AI 视频提示词生成、三版本创意方案、发布文案生成和原创风险检测。完成 PRD、竞品分析、样本库模板和可交互 Web Demo，设计结构复刻度、原创安全分、平台适配度、提示词可用性、制作难度、脚本可发布度等 Agent 评测指标。
