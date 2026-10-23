#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const marketplaceRoot = join(homedir(), ".agents", "plugins");
const marketplacePath = join(marketplaceRoot, "marketplace.json");
const marketplaceName = "gpt-continuum";
const pluginEntry = {
  name: "gpt-continuum",
  source: {
    source: "npm",
    package: "gpt-continuum",
    version: "^0.1.0",
  },
  policy: {
    installation: "AVAILABLE",
    authentication: "ON_INSTALL",
  },
  category: "Productivity",
};

let marketplace = {
  name: marketplaceName,
  interface: { displayName: "GPT Continuum" },
  plugins: [],
};

if (existsSync(marketplacePath)) {
  try {
    marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
  } catch (error) {
    console.error(`Could not read ${marketplacePath}: ${error.message}`);
    process.exit(1);
  }
}

marketplace.name ||= marketplaceName;
marketplace.interface ||= { displayName: "GPT Continuum" };
marketplace.plugins = Array.isArray(marketplace.plugins) ? marketplace.plugins : [];
marketplace.plugins = marketplace.plugins.filter((plugin) => plugin.name !== "gpt-continuum");
marketplace.plugins.push(pluginEntry);

mkdirSync(marketplaceRoot, { recursive: true });
writeFileSync(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`);
console.log(`GPT Continuum added to ${marketplacePath}`);
console.log("Restart ChatGPT desktop, then open Plugins → Personal and install it.");
