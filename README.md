# PERSONA · Rin — AI 虚拟伴侣控制台

参考「PERSONA Lucia」设计稿实现的深色磨砂玻璃风格虚拟伴侣前端：左侧人物立绘展示（40%），右侧模型 / 背景 / 连接控制台；点击「连接」进入流式聊天室。

> 技术栈：Next.js 14 (App Router) · React 18 · Tailwind CSS 3 · Zustand 5 · lucide-react · Vercel AI SDK（流式）· DeepSeek（OpenAI 兼容接口）

## 当前人设：凛（Rin）

- 完整人设存档：`config/persona-rin.md`（身份、外貌锚点、四状态造型、性格、说话风格、记忆/吃醋机制、示例对话）
- 生效的 System Prompt：`config/character.config.ts` 的 `fullSystemPrompt`（完整人格）与 `liteSystemPrompt`（精简设定）
- 聊天室开场白与建议话题：同文件的 `greeting` / `suggestions` 字段
- 立绘：三个状态的占位图在 `public/portraits/`（名流 / 午后 / 专注），真实图到位后替换同名文件即可；支持动态立绘——给 `config/character.config.ts` 的 `portraits[].motion` 填 mp4/webm 视频或动图地址即可自动循环播放，静态图则自带 Ken Burns 缓慢推近动效

## 功能特性

- **配置驱动**：人物名称、简介、立绘、System Prompt 全部集中在 `config/character.config.ts`，改配置零组件改动
- **左侧视觉区**：大图 `object-cover` 自适应 + 左下角大标题标语 + 底部 4 个立绘缩略图无缝切换
- **右侧控制区**：连接状态指示（未连接/已连接/生成中）、统计面板（占位）、模型卡片单选、背景包单选、连接/停止按钮、主动联系开关
- **聊天室**：流式打字机效果、可中途停止、上下文窗口（最近 12 条）、建议开场白
- **持久化**：聊天记录 localStorage 保存（zustand persist），刷新不丢
- **接口**：服务端 `/api/chat` 走 Vercel AI SDK 调用 DeepSeek，换环境变量即可切任意 OpenAI 兼容服务

## 快速开始

要求 Node.js ≥ 18.17。

```bash
pnpm install        # 或 npm install
# 复制 .env.local.example 为 .env.local 并填入 DEEPSEEK_API_KEY
pnpm dev
```

打开 http://localhost:3000 。不配 Key 时 UI 完全可用，聊天时会收到「未配置 DEEPSEEK_API_KEY」提示。

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek API Key（必填，聊天功能用） | — |
| `DEEPSEEK_BASE_URL` | OpenAI 兼容服务的**根地址**（AI SDK 会自动追加 `/chat/completions`，不要带上它） | `https://api.deepseek.com` |

## 目录结构

```
lucia-companion/
├── app/
│   ├── api/chat/route.ts        # DeepSeek 流式 SSE 路由（AI SDK streamText）
│   ├── chat/page.tsx            # 聊天室页面
│   ├── layout.tsx               # 根布局（dark 主题）
│   ├── page.tsx                 # 控制台主页（左右分栏）
│   ├── globals.css              # 深色 Token + 磨砂玻璃工具类
│   └── icon.svg
├── components/
│   ├── chat/                    # chat-room（聊天室）/ message-bubble（气泡）
│   ├── console/                 # visual-panel / control-panel / status-bar /
│   │                            # stats-panel / model-select / background-select / connect-actions
│   └── ui/                      # button / card / radio-group / switch（shadcn 风格，无 Radix 依赖）
├── config/
│   └── character.config.ts      # ★ 人物配置（人设/立绘/模型/背景包全在这里）
├── lib/
│   ├── api.ts                   # 客户端流式请求封装（SSE 解析）
│   ├── deepseek.ts              # 服务端 DeepSeek 流式调用（Vercel AI SDK）
│   └── utils.ts                 # cn()
├── public/portraits/            # 4 张立绘占位图（换成同名 PNG/JPG 即可）
├── store/
│   ├── console-store.ts         # 控制台状态（Zustand）
│   └── chat-store.ts            # 聊天记录（Zustand persist → localStorage）
├── types/index.ts
├── .env.local.example
├── Dockerfile
└── package.json
```

## 自定义人物（人设最后再加也来得及）

修改 `config/character.config.ts`：

- `name` / `displayName` / `tagline` / `companionTitle` — 名称与标语
- `portraits[]` — 立绘数组（表情/服装），文件放 `public/portraits/`，替换同名文件即可换图，或改 `src` 指向新文件
- `fullSystemPrompt` — 完整背景（完整人格与成长模型）的 System Prompt
- `liteSystemPrompt` — 精简背景（关键设定）的 System Prompt
- `modelOptions[]` — 模型卡片（标题/描述/`apiModel` 实际模型名）
- `backgroundPacks[]` — 背景包选项
- `stats[]` — 统计面板占位数据

## API 说明

`POST /api/chat`

```json
{
  "messages": [{ "role": "user", "content": "晚安" }],
  "model": "deepseek-v4-pro",
  "backgroundMode": "full"
}
```

返回 SSE 流，每帧：`data: {"content":"增量文本"}`

## 分享给别人（不买域名）

| 方案 | 对方访问地址 | 条件 | 适合 |
| --- | --- | --- | --- |
| 局域网直连 | `http://<你的局域网IP>:3000` | 同一 WiFi/路由器 | 家庭、宿舍、公司内网（最快最省事） |
| 内网穿透（cpolar / natapp / 花生壳） | `https://xxx.cpolar.top` 等免费二级域名 | 注册免费账号（国内服务需实名） | 异地朋友临时访问，电脑需保持开机 |
| Tailscale Funnel | `https://xxx.ts.net` | 免费 Tailscale 账号 | 免端口映射、自动 HTTPS，适合常开分享 |
| 免费托管子域名 | `https://xxx.vercel.app` 或 `xxx.onrender.com` | 免费账号，代码推上去 | 永久链接，不依赖你的电脑开机 |

**局域网开启方式**：`pnpm dev:lan`（已内置脚本，等效 `next dev -H 0.0.0.0`），并在 Windows 防火墙放行 3000 端口。

**对方如何使用**：打开地址后，点控制台右上角 ⚙「API 设置」，填入**他自己的** DeepSeek Key 保存即可开始聊天——Key 保存在他自己的浏览器里，你的服务端无需配置任何密钥，也不需要你出 API 费用。

- **源码分享**：打包本目录（去掉 `node_modules/` 和 `.next/`），对方 `pnpm install && pnpm dev` 并填入自己的 Key
- **Docker**：`docker build -t lucia-companion . && docker run -p 3000:3000 lucia-companion`

## 免费部署（不买域名，永久链接，不依赖本机开机）

### 方案 A：Vercel（`https://xxx.vercel.app`）

1. 注册 [vercel.com](https://vercel.com)（可用 GitHub 账号一键登录）；
2. 把本项目推到 GitHub 仓库；
3. Vercel 控制台 → Add New → Project → Import 该仓库，Framework 选 Next.js；
4. **无需设置任何环境变量**（访客在页面 ⚙ API 设置里填自己的 Key）→ Deploy；
5. 得到永久地址。国内访客建议挂梯子访问。

### 方案 B：Cloudflare Pages（`https://xxx.pages.dev`，国内直连普遍可用）

适配器已预装（`@cloudflare/next-on-pages` + `wrangler.toml` + `pnpm build:cf` 脚本，API 路由已改为 edge 运行时），步骤：

1. 注册 [dash.cloudflare.com](https://dash.cloudflare.com)（免费）；
2. 把本项目推到 GitHub 仓库；
3. Cloudflare 控制台 → Workers & Pages → Create → Pages → Connect to Git → 选该仓库；
4. 构建设置：Build command 填 `pnpm build:cf`，Output directory 填 `.vercel/output/static`，环境变量 `NODE_VERSION=20`；
5. Save and Deploy → 得到 `https://xxx.pages.dev` 永久地址，国内无需梯子。

> 部署后对方打开地址 → 点 ⚙「API 设置」填自己的 DeepSeek Key → 即可聊天。你的服务端零密钥、零成本。

## 后续扩展建议

- 聊天室已预留独立路由 `/chat`，可直接扩展：语音（TTS）、图片发送、历史会话列表
- UI 组件为 shadcn 风格，后续可运行 `npx shadcn@latest init` 引入官方组件
- 参考的开源项目：[Lobe Chat](https://github.com/lobehub/lobe-chat)（多供应商聊天框架）、[Vercel AI SDK](https://github.com/vercel/ai)（本项目的流式层）
