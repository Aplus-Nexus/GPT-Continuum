import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("plugin.json", "utf8"));
const mcp = JSON.parse(readFileSync("mcp.json", "utf8"));
const marketplace = JSON.parse(readFileSync(".agents/plugins/marketplace.json", "utf8"));
const html = readFileSync("public/gpt-continuum.html", "utf8");
const installer = readFileSync("install.mjs", "utf8");
const widgetScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

if (manifest.name !== "gpt-continuum") throw new Error("plugin.json has an unexpected name");
const mcpServer = mcp.mcpServers?.["gpt-continuum"];
if (mcpServer?.type !== "stdio") throw new Error("mcp.json must use stdio");
if (mcpServer?.command !== "npx") throw new Error("mcp.json must launch with npx");
if (mcpServer?.args?.[1] !== "github:JulianRyder01/GPT-Continuum") throw new Error("mcp.json must launch the GitHub package");
if (!installer.includes(".agents") || !installer.includes("gpt-continuum")) throw new Error("Installer is incomplete");
if (!marketplace.plugins?.some((plugin) => plugin.name === "gpt-continuum")) throw new Error("Marketplace entry missing");
for (const marker of ["sendFollowUpMessage", "at capacity", "继续，如果已完成请你忽略本条信息", "id=\"start\""]) {
  if (!html.includes(marker)) throw new Error(`Widget is missing ${marker}`);
}
if (!widgetScript) throw new Error("Widget script is missing");
try {
  new Function(widgetScript);
} catch (error) {
  throw new Error(`Widget JavaScript is invalid: ${error.message}`);
}
console.log("Manifest, marketplace, and widget checks passed.");
