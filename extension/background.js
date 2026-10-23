const JOBS_KEY = "multiChatJobs";

async function readJobs() {
  const stored = await chrome.storage.local.get(JOBS_KEY);
  return stored[JOBS_KEY] && typeof stored[JOBS_KEY] === "object" ? stored[JOBS_KEY] : {};
}

async function writeJobs(jobs) {
  await chrome.storage.local.set({ [JOBS_KEY]: jobs });
}

async function chatTabs() {
  return chrome.tabs.query({
    url: ["https://chatgpt.com/*", "https://chat.openai.com/*"]
  });
}

function tabSummary(tab, job) {
  return {
    id: tab.id,
    title: tab.title || "ChatGPT conversation",
    url: tab.url || "",
    active: Boolean(tab.active),
    windowId: tab.windowId,
    job: job || null
  };
}

async function sendToTab(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return { tabId, ok: true };
  } catch (error) {
    return { tabId, ok: false, error: error.message };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message?.type === "LIST_TABS") {
      const jobs = await readJobs();
      const tabs = await chatTabs();
      sendResponse({ tabs: tabs.map((tab) => tabSummary(tab, jobs[String(tab.id)])) });
      return;
    }

    if (message?.type === "START_TABS") {
      const tabIds = Array.isArray(message.tabIds) ? message.tabIds : [];
      const settings = {
        message: String(message.settings?.message || "").trim(),
        interval: Math.max(5, Math.min(86400, Number(message.settings?.interval) || 60)),
        maxAttempts: Math.max(0, Math.floor(Number(message.settings?.maxAttempts) || 0)),
        startedAt: Date.now()
      };
      const jobs = await readJobs();
      const results = [];
      for (const tabId of tabIds) {
        jobs[String(tabId)] = settings;
        results.push(await sendToTab(tabId, { type: "START_JOB", settings }));
      }
      await writeJobs(jobs);
      sendResponse({ results });
      return;
    }

    if (message?.type === "STOP_TABS") {
      const tabIds = Array.isArray(message.tabIds) ? message.tabIds : [];
      const jobs = await readJobs();
      const results = [];
      for (const tabId of tabIds) {
        delete jobs[String(tabId)];
        results.push(await sendToTab(tabId, { type: "STOP_JOB" }));
      }
      await writeJobs(jobs);
      sendResponse({ results });
      return;
    }

    if (message?.type === "CONTENT_READY") {
      const tabId = message.tabId ?? _sender.tab?.id;
      const jobs = await readJobs();
      if (tabId != null && jobs[String(tabId)]) {
        await sendToTab(tabId, { type: "START_JOB", settings: jobs[String(tabId)] });
      }
      sendResponse({ ok: true });
      return;
    }

    sendResponse({ ok: false, error: "Unknown message" });
  })().catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const jobs = await readJobs();
  if (jobs[String(tabId)]) {
    delete jobs[String(tabId)];
    await writeJobs(jobs);
  }
});
