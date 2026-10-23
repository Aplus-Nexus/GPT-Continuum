#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WIDGET_URI = "ui://gpt-continuum/widget.html";
const widgetHtml = readFileSync(join(ROOT, "public", "gpt-continuum.html"), "utf8");

function createAppServer() {
  const server = new McpServer({
    name: "gpt-continuum",
    version: "0.1.0",
  });

  registerAppResource(
    server,
    "gpt-continuum-widget",
    WIDGET_URI,
    {},
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              ...(process.env.WIDGET_DOMAIN ? { domain: process.env.WIDGET_DOMAIN } : {}),
            },
            "openai/widgetDescription":
              "A small timer that sends a user-configured follow-up message to the current conversation.",
            "openai/ui": {
              availableDisplayModes: ["inline", "pip", "fullscreen"],
            },
          },
        },
      ],
    }),
  );

  registerAppTool(
    server,
    "open_autocontinue",
    {
      title: "Open GPT Continuum",
      description:
        "Opens the GPT Continuum timer. The user controls the timer and the exact message; it sends only to the active ChatGPT conversation.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        ui: {
          resourceUri: WIDGET_URI,
          visibility: ["model", "app"],
        },
        "openai/outputTemplate": WIDGET_URI,
        "openai/widgetAccessible": true,
        "openai/ui": {
          entrypoints: [{ type: "global" }],
        },
        "openai/toolInvocation/invoking": "Opening timer…",
        "openai/toolInvocation/invoked": "Timer ready",
      },
    },
    async () => ({
      content: [
        {
          type: "text",
          text: "GPT Continuum is ready. Start the timer from the widget when you want to continue this conversation.",
        },
      ],
    }),
  );

  return server;
}

if (process.argv[2] === "install") {
  await import("./install.mjs");
} else {
  const server = createAppServer();
  const transport = new StdioServerTransport();

  // MCP stdio reserves stdout for protocol traffic. Keep diagnostics on stderr.
  process.on("uncaughtException", (error) => console.error("GPT Continuum failed", error));
  process.on("unhandledRejection", (error) => console.error("GPT Continuum failed", error));

  await server.connect(transport);
}
