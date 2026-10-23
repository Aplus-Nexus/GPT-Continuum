# GPT Continuum

<p align="center"><img src="assets/logo.png" alt="GPT Continuum logo" width="180" /></p>

<p align="center"><strong>让你的 GPT 不再停在 “at capacity”。</strong></p>

GPT 总是显示 “at capacity”，长任务停在半路，官方客户端又不会自动重试？GPT Continuum 是一个本地运行的 ChatGPT Plugin / MCP App。它会按设定间隔向当前对话发送 follow-up message，让任务接着运行。

## 这个项目解决什么问题

ChatGPT 在长任务、代码生成或高峰期可能因为 **at capacity**、临时中断或模型提前停下而卡住。GPT Continuum 把反复手动发送“继续”变成一个可见、可停止、可配置的定时器。

![GPT Continuum 插件截图](assets/screenshot.png)

## 特性

- 不需要 HTTPS 服务、数据库或 OpenAI API Key
- 使用 ChatGPT 官方 `sendFollowUpMessage` 能力
- 中文、英文模板和自定义消息
- 可设置发送间隔和最多次数
- 支持立即发送、开始、停止和 PiP 展示
- 不读取聊天记录，不模拟键盘，不接管剪贴板
- 本地 `stdio` MCP 服务，插件安装后自动启动

## 安装

用户安装 Node.js 20+ 后执行：

```bash
npx --yes github:JulianRyder01/GPT-Continuum install
```

重启 ChatGPT 桌面端，打开 **Plugins → Personal**，搜索并安装 **GPT Continuum**。在新对话中打开插件，填写消息和间隔，然后点击 **Start**。

## 开发

```bash
npm install
npm test
npm start
```

`npm start` 启动本地 MCP stdio 服务。标准输出用于 MCP 协议，诊断信息写入标准错误。

## 使用限制

插件只按时间发送消息，不读取回答，也不会判断任务是否完成。默认消息会提醒模型：如果任务已经完成，请忽略这条消息。任务完成后请点击 **Stop**。

建议从 30–60 秒的间隔开始。间隔过短可能导致重复请求或触发 ChatGPT 限流。关闭插件面板或使用不支持本地插件的 ChatGPT 客户端后，定时器会停止。

本项目使用本地 `stdio` MCP，因此不要求 HTTPS；公共 Plugin Directory 对本地 MCP 有 Desktop only 和额外审核限制。

### 如果显示 “No plugins found”

请完全退出并重新打开 **ChatGPT 桌面端**，再进入 **Plugins → Personal**。不要在 `http://127.0.0.1:8765/gpt-continuum.html` 本地预览页测试发送；该页面没有 ChatGPT 消息桥接，只用于查看界面。如果 Personal 仍为空，请重新执行上面的 `npx` 命令，安装器会更新 `~/.agents/plugins/marketplace.json`。

## 目录结构

```text
GPT-Continuum/
├── assets/logo.png
├── public/gpt-continuum.html
├── server.mjs
├── install.mjs
├── mcp.json
└── plugin.json
```

## 许可证

MIT，见 [LICENSE](LICENSE)。
