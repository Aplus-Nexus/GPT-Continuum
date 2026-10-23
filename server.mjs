#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WIDGET_URI = "ui://gpt-continuum/widget-v3.html";
const widgetHtml = readFileSync(join(ROOT, "public", "gpt-continuum.html"), "utf8");

function codexBinaryCandidates() {
  const candidates = [];
  if (process.env.CODEX_BIN) candidates.push(process.env.CODEX_BIN);
  if (process.platform === "darwin") {
    candidates.push(
      "/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex",
      "/Applications/Codex.app/Contents/Resources/codex",
    );
  }
  if (process.platform === "win32") {
    candidates.push(
      join(process.env.LOCALAPPDATA || "", "Programs", "Codex", "codex.exe"),
      join(process.env.LOCALAPPDATA || "", "Programs", "ChatGPT", "resources", "codex.exe"),
    );
  }
  candidates.push("codex");
  return [...new Set(candidates.filter(Boolean))];
}

class CodexAppServerClient {
  constructor() {
    this.child = null;
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = "";
    this.starting = null;
  }

  async ensureConnected() {
    if (this.child && !this.child.killed) return;
    if (this.starting) return this.starting;
    this.starting = this.start().finally(() => { this.starting = null; });
    return this.starting;
  }

  async start() {
    let lastError = null;
    for (const binary of codexBinaryCandidates()) {
      try {
        await this.startWith(binary);
        return;
      } catch (error) {
        lastError = error;
        this.close();
      }
    }
    throw new Error(`找不到 Codex app-server。请设置 CODEX_BIN。${lastError ? ` ${lastError.message}` : ""}`);
  }

  startWith(binary) {
    return new Promise((resolve, reject) => {
      const child = spawn(binary, ["app-server", "--listen", "stdio://"], {
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
      });
      let settled = false;
      const fail = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };
      child.once("error", fail);
      child.once("spawn", async () => {
        this.child = child;
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (chunk) => this.consume(chunk));
        child.stderr.setEncoding("utf8");
        child.stderr.on("data", () => {});
        child.once("exit", () => {
          for (const pending of this.pending.values()) pending.reject(new Error("Codex app-server exited"));
          this.pending.clear();
          this.child = null;
        });
        try {
          await this.request("initialize", {
            clientInfo: { name: "gpt-continuum", title: "GPT Continuum", version: "0.3.0" },
            capabilities: {},
            protocolVersion: "2025-11-25",
          });
          this.notify("initialized", {});
          settled = true;
          resolve();
        } catch (error) {
          fail(error);
        }
      });
    });
  }

  consume(chunk) {
    this.buffer += chunk;
    let newline;
    while ((newline = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;
      let message;
      try { message = JSON.parse(line); } catch (_) { continue; }
      if (message.id == null) continue;
      const pending = this.pending.get(String(message.id));
      if (!pending) continue;
      this.pending.delete(String(message.id));
      if (message.error) pending.reject(new Error(message.error.message || "Codex app-server request failed"));
      else pending.resolve(message.result);
    }
  }

  request(method, params) {
    return new Promise((resolve, reject) => {
      if (!this.child || this.child.killed) {
        reject(new Error("Codex app-server is not connected"));
        return;
      }
      const id = this.nextId++;
      this.pending.set(String(id), { resolve, reject });
      this.child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    });
  }

  notify(method, params) {
    if (this.child && !this.child.killed) this.child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
  }

  close() {
    if (this.child && !this.child.killed) this.child.kill();
    this.child = null;
    this.buffer = "";
  }
}

const codexClient = new CodexAppServerClient();
const codexJobs = new Map();

function shutdownCodexClient() {
  for (const job of codexJobs.values()) clearTimeout(job.timer);
  codexJobs.clear();
  codexClient.close();
}

process.once("exit", shutdownCodexClient);
process.once("SIGINT", () => { shutdownCodexClient(); process.exit(0); });
process.once("SIGTERM", () => { shutdownCodexClient(); process.exit(0); });

function codexThreadSummary(thread) {
  return {
    id: thread.id,
    name: thread.name || thread.preview || "Untitled Codex thread",
    preview: thread.preview || "",
    status: thread.status?.type || "unknown",
    activeFlags: thread.status?.activeFlags || [],
    cwd: thread.cwd || "",
    model: thread.model || "",
    updatedAt: thread.updatedAt || thread.recencyAt || null,
  };
}

async function listCodexThreads() {
  await codexClient.ensureConnected();
  const result = await codexClient.request("thread/list", {
    limit: 100,
    archived: false,
    sortKey: "updated_at",
    sortDirection: "desc",
  });
  return (result.data || []).map(codexThreadSummary);
}

async function sendCodexMessage(threadId, text) {
  await codexClient.ensureConnected();
  let latestTurn = null;
  try {
    const turns = await codexClient.request("thread/turns/list", {
      threadId,
      limit: 1,
      sortDirection: "desc",
      itemsView: "notLoaded",
    });
    latestTurn = turns.data?.[0] || null;
  } catch (_) {
    // A not-yet-loaded thread can still accept a queued message.
  }

  const input = [{ type: "text", text }];
  if (latestTurn?.status === "inProgress") {
    try {
      const result = await codexClient.request("turn/steer", {
        threadId,
        expectedTurnId: latestTurn.id,
        input,
        clientUserMessageId: randomUUID(),
      });
      return { mode: "steer", turnId: result.turnId || latestTurn.id };
    } catch (_) {
      // Some Codex turns cannot be steered; queue the same text instead.
    }
  }

  const result = await codexClient.request("thread/queue/add", {
    threadId,
    clientUserMessageId: randomUUID(),
    input,
  });
  const queuedSubmissionId = result.queuedSubmission?.id || null;
  try {
    await codexClient.request("thread/queue/start", { threadId, queuedSubmissionId });
  } catch (_) {
    // Older Codex hosts start a queue submission automatically.
  }
  return { mode: "queue", queued: result };
}

function stopCodexJobs(threadIds = null) {
  const ids = threadIds?.length ? new Set(threadIds) : new Set(codexJobs.keys());
  let stopped = 0;
  for (const id of ids) {
    const job = codexJobs.get(id);
    if (!job) continue;
    clearTimeout(job.timer);
    codexJobs.delete(id);
    stopped += 1;
  }
  return stopped;
}

async function runCodexJob(job) {
  if (!codexJobs.has(job.threadId)) return;
  job.attempts += 1;
  try {
    job.lastResult = await sendCodexMessage(job.threadId, job.message);
    job.lastError = null;
  } catch (error) {
    job.lastError = error.message;
  }
  if (!codexJobs.has(job.threadId)) return;
  if (job.maxAttempts > 0 && job.attempts >= job.maxAttempts) {
    codexJobs.delete(job.threadId);
    return;
  }
  job.timer = setTimeout(() => void runCodexJob(job), job.intervalSeconds * 1000);
}

async function startCodexJobs({ threadIds, message, intervalSeconds = 60, maxAttempts = 0 }) {
  const ids = [...new Set(threadIds || [])];
  if (!ids.length) throw new Error("至少选择一个 Codex 页面");
  if (!String(message || "").trim()) throw new Error("发送内容不能为空");
  const interval = Math.max(5, Math.min(86400, Number(intervalSeconds) || 60));
  const max = Math.max(0, Math.floor(Number(maxAttempts) || 0));
  stopCodexJobs(ids);
  for (const threadId of ids) {
    const job = {
      threadId,
      message: String(message).trim(),
      intervalSeconds: interval,
      maxAttempts: max,
      attempts: 0,
      lastResult: null,
      lastError: null,
      timer: null,
    };
    codexJobs.set(threadId, job);
    await runCodexJob(job);
  }
  return codexJobStatus();
}

function codexJobStatus() {
  return [...codexJobs.values()].map((job) => ({
    threadId: job.threadId,
    message: job.message,
    intervalSeconds: job.intervalSeconds,
    maxAttempts: job.maxAttempts,
    attempts: job.attempts,
    lastResult: job.lastResult,
    lastError: job.lastError,
  }));
}

function resultPayload(text, structuredContent) {
  return { content: [{ type: "text", text }], structuredContent };
}

function createAppServer() {
  const server = new McpServer({
    name: "gpt-continuum",
    version: "0.3.0",
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
              // ChatGPT supports inline and fullscreen for MCP Apps. PiP is
              // not a supported display mode in the current desktop host.
              availableDisplayModes: ["inline", "fullscreen"],
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
        "Opens GPT Continuum. In ChatGPT it continues the current conversation; in Codex Desktop it can list and continue multiple selected Codex threads.",
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
          text: "GPT Continuum is ready. Use the current-conversation timer or the Codex multi-thread panel when available.",
        },
      ],
    }),
  );

  registerAppTool(
    server,
    "codex_list_threads",
    {
      title: "List Codex pages",
      description: "List the user’s open, non-archived Codex threads so the user can choose multiple pages to continue.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      _meta: { "openai/widgetAccessible": true, "ui/widgetAccessible": true },
    },
    async () => {
      const threads = await listCodexThreads();
      return resultPayload(JSON.stringify({ threads }), { threads });
    },
  );

  registerAppTool(
    server,
    "codex_start_continuum",
    {
      title: "Start Codex multi-thread continuation",
      description: "Start a visible timer that sends the configured message to each selected Codex thread. Active turns use steer; idle turns use the Codex queue.",
      inputSchema: {
        threadIds: z.array(z.string()).min(1),
        message: z.string(),
        intervalSeconds: z.number().int().min(5).max(86400).optional(),
        maxAttempts: z.number().int().min(0).max(9999).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      _meta: { "openai/widgetAccessible": true, "ui/widgetAccessible": true },
    },
    async ({ threadIds, message, intervalSeconds, maxAttempts }) => {
      const jobs = await startCodexJobs({ threadIds, message, intervalSeconds, maxAttempts });
      return resultPayload(JSON.stringify({ jobs }), { jobs });
    },
  );

  registerAppTool(
    server,
    "codex_stop_continuum",
    {
      title: "Stop Codex continuation",
      description: "Stop timers for selected Codex threads, or all GPT Continuum Codex timers when no thread IDs are supplied.",
      inputSchema: { threadIds: z.array(z.string()).optional() },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
      _meta: { "openai/widgetAccessible": true, "ui/widgetAccessible": true },
    },
    async ({ threadIds }) => {
      const stopped = stopCodexJobs(threadIds || null);
      return resultPayload(`Stopped ${stopped} Codex timer(s).`, { stopped, jobs: codexJobStatus() });
    },
  );

  registerAppTool(
    server,
    "codex_continuum_status",
    {
      title: "Codex continuation status",
      description: "Read the GPT Continuum timers currently running for Codex threads.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      _meta: { "openai/widgetAccessible": true, "ui/widgetAccessible": true },
    },
    async () => {
      const jobs = codexJobStatus();
      return resultPayload(JSON.stringify({ jobs }), { jobs });
    },
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
