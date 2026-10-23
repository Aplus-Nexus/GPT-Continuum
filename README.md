# GPT Continuum

<p align="center">
  <img src="assets/logo.png" alt="GPT Continuum logo" width="180" />
</p>

<p align="center"><strong>让你的 GPT 不再停在 “at capacity”。</strong></p>

GPT 总是显示 “at capacity”，长任务停在半路，官方客户端又不会自动重试？GPT Continuum 是一个本地运行的 ChatGPT Plugin / MCP App：按间隔向当前对话发送“继续”消息，让任务接着跑下去。

**[中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md)**

## 这个项目解决什么问题

ChatGPT 在长任务、代码生成或高峰期经常会因为 **at capacity**、暂时中断或模型提前停下而卡住。用户需要手动反复发送“继续”，任务才会恢复。

GPT Continuum 把这一步变成一个可见、可停止、可配置的定时器：点击开始后，它会向当前会话发送 follow-up message；任务完成后，点击停止即可。

![GPT Continuum plugin screenshot](assets/screenshot.png)

## Why GPT Continuum

- 不需要 HTTPS 服务、数据库或 OpenAI API Key
- 通过 ChatGPT 官方 `sendFollowUpMessage` 能力发送消息
- 中文、英文模板和自定义内容
- 间隔、最多次数、立即发送、停止和 PiP 展示
- 不读取聊天记录，不模拟键盘，不接管剪贴板
- 本地 `stdio` MCP 服务，安装后自动启动

## Quick install

用户只需安装 Node.js 20+，然后运行：

```bash
npx --yes github:JulianRyder01/GPT-Continuum install
```

重启 ChatGPT 桌面端，在 **Plugins → Personal** 搜索并安装 **GPT Continuum**。打开插件，设置消息和间隔，点击 **Start**。

本项目使用本地 `stdio` MCP，因此不需要用户部署 HTTPS。公共 ChatGPT Plugin Directory 对本地 MCP 有 Desktop only 和额外审核限制；这也是本项目默认采用 GitHub + 本地 marketplace 的原因。

## Development

```bash
npm install
npm test
npm start
```

`npm start` 启动 MCP stdio 进程。标准输出保留给 MCP 协议，诊断信息写入标准错误。

## Safety and limits

GPT Continuum 只按时间发送消息，不判断回答是否完成。默认文本包含“如果已完成请你忽略本条信息”，任务结束后请点击 **Stop**。建议间隔从 30–60 秒开始，过短的间隔可能触发限流。

插件关闭或 ChatGPT 桌面端不支持本地插件时，计时器不会继续运行。

## Project layout

```text
GPT-Continuum/
├── assets/logo.png           # GitHub / plugin logo
├── public/gpt-continuum.html # ChatGPT widget
├── server.mjs                # Local MCP stdio server
├── install.mjs               # One-command marketplace installer
├── mcp.json                  # Local stdio MCP configuration
└── plugin.json               # Plugin manifest
```

## License

MIT. See [LICENSE](LICENSE).
