# GPT Continuum

<p align="center">
  <img src="assets/logo.png" alt="GPT Continuum logo" width="180" />
</p>

<p align="center"><strong>让你的 GPT 不再停在 “at capacity”。</strong></p>

GPT 总是显示 “at capacity”，长任务停在半路，官方客户端又不会自动重试？GPT Continuum 提供两种模式：插件模式负责当前对话，浏览器扩展模式可以同时控制多个 ChatGPT 对话标签页。

**[中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md)**

## 这个项目解决什么问题

ChatGPT 在长任务、代码生成或高峰期经常会因为 **at capacity**、暂时中断或模型提前停下而卡住。用户需要手动反复发送“继续”，任务才会恢复。

GPT Continuum 把这一步变成一个可见、可停止、可配置的定时器：点击开始后，它会向当前会话发送 follow-up message；任务完成后，点击停止即可。

![GPT Continuum plugin screenshot](assets/screenshot.png)

## Why GPT Continuum

- 不需要 HTTPS 服务、数据库或 OpenAI API Key
- 通过 ChatGPT 官方 `sendFollowUpMessage` 能力发送消息
- 中文、英文模板和自定义内容
- 间隔、最多次数、立即发送、停止和全屏展示
- 不读取聊天记录，不模拟键盘，不接管剪贴板
- 本地 `stdio` MCP 服务，安装后自动启动
- Chrome/Edge 多标签页控制器，可同时运行多个对话任务

## Quick install

### 多会话模式（推荐）

如果你要同时监听多个对话并一起发送消息，请使用[浏览器扩展](extension/README.md)。它适用于 Chrome/Edge，在 Windows 和 macOS 都能运行：选择多个已打开的 ChatGPT 标签页，扩展会优先点击 **Steer**，没有 Steer 时才点击发送。

### 单会话插件模式

用户只需安装 Node.js 20+，然后运行：

```bash
npx --yes github:JulianRyder01/GPT-Continuum install
```

重启 ChatGPT 桌面端，在 **Plugins → Personal** 搜索并安装 **GPT Continuum**。打开插件，设置消息和间隔，点击 **Start**。

插件模式受 ChatGPT 官方桥接限制，只能向打开插件的当前对话发送消息；它不能选择其他已有对话。

### Codex 桌面多页面模式

在 Codex Desktop 中安装并打开 GPT Continuum 后，面板会显示 **Codex 桌面多页面**。点击“加载 Codex 页面”，选择多个线程，再点击“开始多页面继续”。运行中的线程使用 Steer，空闲线程使用 Codex 队列；消息会直接进入选中的 Codex 页面，而不是发给插件所在页面。该模式使用本机 Codex app-server，不需要 API Key 或 HTTPS。

本项目使用本地 `stdio` MCP，因此不需要用户部署 HTTPS。公共 ChatGPT Plugin Directory 对本地 MCP 有 Desktop only 和额外审核限制；这也是本项目默认采用 GitHub + 本地 marketplace 的原因。

### 如果显示 “No plugins found”

请完全退出并重新打开 **ChatGPT 桌面端**，再进入 **Plugins → Personal**。不要在 `http://127.0.0.1:8765/gpt-continuum.html` 这个本地预览页里测试发送：预览页没有 ChatGPT 的消息桥接，只用于查看界面。若 Personal 仍为空，请重新执行上面的 `npx` 命令；安装器会更新 `~/.agents/plugins/marketplace.json`。

## Development

```bash
npm install
npm test
npm start
```

`npm start` 启动 MCP stdio 进程。标准输出保留给 MCP 协议，诊断信息写入标准错误。

## Safety and limits

GPT Continuum 只按时间发送消息，不判断回答是否完成。默认文本包含“如果已完成请你忽略本条信息”，任务结束后请点击 **Stop**。建议间隔从 30–60 秒开始，过短的间隔可能触发限流。

插件关闭或 ChatGPT 桌面端不支持本地插件时，插件模式的计时器不会继续运行。浏览器扩展模式要求目标 ChatGPT 标签页保持打开并登录。

## Project layout

```text
GPT-Continuum/
├── assets/logo.png           # GitHub / plugin logo
├── extension/                # Chrome/Edge multi-chat controller
├── public/gpt-continuum.html # ChatGPT widget
├── server.mjs                # Local MCP stdio server
├── install.mjs               # One-command marketplace installer
├── mcp.json                  # Local stdio MCP configuration
└── plugin.json               # Plugin manifest
```

## License

MIT. See [LICENSE](LICENSE).
