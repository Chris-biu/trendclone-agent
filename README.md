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
- AI 自动判断镜头数量
- 调节结构贴近度
- 生成爆款结构拆解
- 生成同款原创脚本
- 生成分镜和 AI 视频提示词
- 生成发布标题、封面文案、话题标签
- 输出原创风险检测
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

## 大模型配置

项目使用 OpenAI-compatible Chat Completions 接口。复制 `.env.example` 为 `.env`，填入自己的模型服务：

```text
AI_API_KEY=你的 API Key
AI_API_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat
PORT=5179
```

不填写 `AI_API_KEY` 时，系统会使用本地规则生成器。这个回退模式适合演示 UI 和产品流程；填写后，`/api/generate` 会请求真实大模型，并把模型输出规范化为稳定 JSON Schema。

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
├── tests
│   └── agent-core.test.js
├── docs
│   ├── trendclone-prd.md
│   └── competitor-analysis.md
├── data
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

独立设计并开发 TrendClone Agent，面向 AI 视频创作者的爆款视频结构复刻与原创改编工具，支持参考视频输入、爆款结构拆解、动态镜头规划、同款原创脚本生成、AI 视频提示词生成、发布文案生成和原创风险检测。完成 PRD、竞品分析、样本库模板和可交互 Web Demo，设计结构贴近度、原创安全分、生成镜头数、脚本可用率等产品指标。
