# GPT Continuum

<p align="center"><img src="assets/logo.png" alt="GPT Continuum logo" width="180" /></p>

<p align="center"><strong>Keep your GPT from stopping at “at capacity”.</strong></p>

Does GPT keep saying “at capacity” while a long task is stuck, with no automatic retry? GPT Continuum has two modes: the plugin handles one current conversation, while the browser extension controls several ChatGPT conversation tabs at once.

## The problem it solves

During peak periods, long tasks, and code generation, ChatGPT can stop at **at capacity**, pause temporarily, or stop before the work is done. GPT Continuum turns the repeated manual “continue” message into a visible, configurable timer that you can stop at any time.

![GPT Continuum plugin screenshot](assets/screenshot.png)

## Features

- No HTTPS service, database, or OpenAI API key
- Uses ChatGPT's official `sendFollowUpMessage` capability
- Chinese and English templates, plus custom text
- Configurable interval and maximum send count
- Start, stop, send once, and fullscreen display mode
- Does not read conversation content or simulate keyboard and clipboard input
- Local `stdio` MCP server that starts automatically after installation
- Chrome/Edge multi-tab controller for several conversations at once

## Install

### Multi-conversation mode (recommended)

Use the [browser extension](extension/README.md) when you want to monitor and message several conversations together. It runs in Chrome/Edge on Windows and macOS: select multiple open ChatGPT tabs, and it prefers **Steer**, falling back to Send when Steer is unavailable.

### Single-conversation plugin mode

Users install Node.js 20+ and run:

```bash
npx --yes github:JulianRyder01/GPT-Continuum install
```

Restart the ChatGPT desktop app, open **Plugins → Personal**, and install **GPT Continuum**. Open it in a new conversation, choose the message and interval, then click **Start**.

The plugin mode follows ChatGPT's official bridge and can send only to the conversation that opened the plugin. It cannot select another existing conversation.

## Development

```bash
npm install
npm test
npm start
```

`npm start` launches the local MCP stdio server. Standard output is reserved for MCP protocol traffic; diagnostics go to standard error.

## Safety and limitations

The plugin sends messages on a schedule. It does not read responses or decide whether the task is complete. The default message tells the model to ignore the prompt when the task is already complete. Click **Stop** when the task finishes.

Start with a 30–60 second interval. Very short intervals can create duplicate requests or hit ChatGPT rate limits. Closing the plugin panel or using a ChatGPT client without local-plugin support stops the plugin timer. Browser-extension jobs require the selected ChatGPT tabs to stay open and signed in.

This project uses local `stdio`, so users do not deploy HTTPS. The public Plugin Directory applies Desktop only and additional review requirements to local MCP plugins.

### If you see “No plugins found”

Fully quit and reopen the **ChatGPT desktop app**, then open **Plugins → Personal** again. Do not test sending from `http://127.0.0.1:8765/gpt-continuum.html`: that local preview has no ChatGPT message bridge and is only for viewing the UI. If Personal is still empty, rerun the `npx` command above; the installer refreshes `~/.agents/plugins/marketplace.json`.

## Project layout

```text
GPT-Continuum/
├── assets/logo.png
├── extension/
├── public/gpt-continuum.html
├── server.mjs
├── install.mjs
├── mcp.json
└── plugin.json
```

## License

MIT. See [LICENSE](LICENSE).
