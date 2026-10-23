# GPT Continuum

<p align="center"><img src="assets/logo.png" alt="GPT Continuum logo" width="180" /></p>

<p align="center"><strong>让 ChatGPT 一直推进，直到任务完成。</strong></p>

GPT Continuum 是一个本地运行的 ChatGPT Plugin / MCP App。它会按设定间隔向当前对话发送 follow-up message，帮助长任务在容量限制、临时中断或模型停顿后继续运行。

## 特性

- 不需要 HTTPS 服务、数据库或 OpenAI API Key
- 使用 ChatGPT 官方 `sendFollowUpMessage` 能力
- 中文、英文模板和自定义消息
- 可设置发送间隔和最多次数
- 支持立即发送、开始、停止和 PiP 展示
- 不读取聊天记录，不模拟键盘，不接管剪贴板
- 本地 `stdio` MCP 服务，插件安装后自动启动

## 安装

维护者首次发布 npm 包：

```bash
npm publish --access public
```

用户安装 Node.js 20+ 后执行：

```bash
npx --yes gpt-continuum@latest install
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
