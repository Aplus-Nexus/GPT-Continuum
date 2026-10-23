const selected = new Set();
let tabs = [];

const $ = (selector) => document.querySelector(selector);

function message(payload) {
  return chrome.runtime.sendMessage(payload);
}

function setStatus(text, error = false) {
  const element = $("#status");
  element.textContent = text;
  element.style.color = error ? "#c0392b" : "#10a37f";
}

function renderTabs() {
  const container = $("#tabs");
  container.textContent = "";
  if (!tabs.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "没有找到 ChatGPT 标签页。请在 Chrome/Edge 打开多个对话。";
    container.appendChild(empty);
    return;
  }
  for (const tab of tabs) {
    const label = document.createElement("label");
    label.className = "tab";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selected.has(tab.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selected.add(tab.id);
      else selected.delete(tab.id);
    });
    const copy = document.createElement("div");
    copy.style.minWidth = "0";
    const title = document.createElement("div");
    title.className = "tab-title";
    title.textContent = tab.title;
    const state = document.createElement("div");
    state.className = "tab-state";
    state.textContent = tab.job ? "运行中" : (tab.active ? "当前标签页" : "未运行");
    copy.append(title, state);
    label.append(checkbox, copy);
    container.appendChild(label);
  }
}

async function refresh() {
  const result = await message({ type: "LIST_TABS" });
  tabs = result.tabs || [];
  const ids = new Set(tabs.map((tab) => tab.id));
  for (const id of selected) if (!ids.has(id)) selected.delete(id);
  renderTabs();
}

$("#refresh").addEventListener("click", () => refresh().catch((error) => setStatus(error.message, true)));
$("#selectAll").addEventListener("click", () => {
  const allSelected = tabs.length > 0 && tabs.every((tab) => selected.has(tab.id));
  if (allSelected) selected.clear();
  else tabs.forEach((tab) => selected.add(tab.id));
  renderTabs();
});

$("#start").addEventListener("click", async () => {
  const tabIds = [...selected];
  if (!tabIds.length) { setStatus("请先选择至少一个对话", true); return; }
  const result = await message({
    type: "START_TABS",
    tabIds,
    settings: {
      message: $("#message").value,
      interval: $("#interval").value,
      maxAttempts: $("#maxAttempts").value
    }
  });
  const failed = (result.results || []).filter((item) => !item.ok);
  setStatus(failed.length ? `${failed.length} 个标签页未连接，请刷新页面后重试` : `已启动 ${tabIds.length} 个对话` , failed.length > 0);
  await refresh();
});

$("#stop").addEventListener("click", async () => {
  const tabIds = [...selected];
  if (!tabIds.length) { setStatus("请先选择至少一个对话", true); return; }
  await message({ type: "STOP_TABS", tabIds });
  setStatus(`已停止 ${tabIds.length} 个对话`);
  await refresh();
});

refresh().catch((error) => setStatus(error.message, true));
