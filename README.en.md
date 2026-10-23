# GPT Continuum

<p align="center"><img src="assets/logo.png" alt="GPT Continuum logo" width="180" /></p>

<p align="center"><strong>Keep ChatGPT moving until the work is done.</strong></p>

GPT Continuum is a local ChatGPT Plugin / MCP App that sends a configurable follow-up message to the active conversation on a timer. It helps long-running tasks recover from capacity limits, temporary interruptions, or a model stopping early.

## Features

- No HTTPS service, database, or OpenAI API key
- Uses ChatGPT's official `sendFollowUpMessage` capability
- Chinese and English templates, plus custom text
- Configurable interval and maximum send count
- Start, stop, send once, and PiP display mode
- Does not read conversation content or simulate keyboard and clipboard input
- Local `stdio` MCP server that starts automatically after installation

## Install

The maintainer publishes the npm package once:

```bash
npm publish --access public
```

Users install Node.js 20+ and run:

```bash
npx --yes gpt-continuum@latest install
```

Restart the ChatGPT desktop app, open **Plugins → Personal**, and install **GPT Continuum**. Open it in a new conversation, choose the message and interval, then click **Start**.

## Development

```bash
npm install
npm test
npm start
```

`npm start` launches the local MCP stdio server. Standard output is reserved for MCP protocol traffic; diagnostics go to standard error.

## Safety and limitations

The plugin sends messages on a schedule. It does not read responses or decide whether the task is complete. The default message tells the model to ignore the prompt when the task is already complete. Click **Stop** when the task finishes.

Start with a 30–60 second interval. Very short intervals can create duplicate requests or hit ChatGPT rate limits. Closing the plugin panel or using a ChatGPT client without local-plugin support stops the timer.

This project uses local `stdio`, so users do not deploy HTTPS. The public Plugin Directory applies Desktop only and additional review requirements to local MCP plugins.

## Project layout

```text
GPT-Continuum/
├── assets/logo.png
├── public/gpt-continuum.html
├── server.mjs
├── install.mjs
├── mcp.json
└── plugin.json
```

## License

MIT. See [LICENSE](LICENSE).
