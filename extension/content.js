(() => {
  const state = {
    running: false,
    message: "",
    interval: 60,
    maxAttempts: 0,
    attempts: 0,
    lastResult: "准备就绪"
  };
  let timer = null;
  let busy = false;
  let overlay = null;

  const visible = (element) => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };

  function composer() {
    const candidates = [
      ...document.querySelectorAll("textarea"),
      ...document.querySelectorAll("[contenteditable='true']"),
      ...document.querySelectorAll("[role='textbox']")
    ];
    return candidates.filter(visible).find((element) => {
      const label = `${element.getAttribute("aria-label") || ""} ${element.getAttribute("placeholder") || ""}`;
      return !/search|搜索/i.test(label);
    }) || null;
  }

  function setComposerText(element, text) {
    element.focus();
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set;
      if (setter) setter.call(element, text);
      else element.value = text;
    } else {
      document.execCommand("selectAll", false);
      document.execCommand("insertText", false, text);
      if ((element.textContent || "").trim() !== text.trim()) element.textContent = text;
    }
    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: text
    }));
  }

  function buttonLabel(button) {
    return [button.getAttribute("aria-label"), button.getAttribute("title"), button.textContent]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  function sendButton() {
    const buttons = [...document.querySelectorAll("button")].filter(visible).filter((button) => !button.disabled);
    const preferred = buttons.find((button) => /steer|引导|继续|continue|send|发送|submit|提交/i.test(buttonLabel(button)) && !/stop|停止|voice|语音/i.test(buttonLabel(button)));
    if (preferred) return preferred;
    return buttons.find((button) => button.type === "submit") || null;
  }

  async function sendOnce() {
    if (busy || !state.message) return false;
    const input = composer();
    if (!input) {
      state.lastResult = "找不到当前对话输入框";
      renderOverlay();
      return false;
    }
    busy = true;
    try {
      setComposerText(input, state.message);
      await new Promise((resolve) => setTimeout(resolve, 120));
      const button = sendButton();
      if (!button) {
        state.lastResult = "找不到 Steer/发送按钮";
        return false;
      }
      button.click();
      state.attempts += 1;
      state.lastResult = `已发送第 ${state.attempts} 次`;
      if (state.maxAttempts > 0 && state.attempts >= state.maxAttempts) stopJob();
      return true;
    } catch (error) {
      state.lastResult = `发送失败：${error.message}`;
      return false;
    } finally {
      busy = false;
      renderOverlay();
    }
  }

  function schedule() {
    clearTimeout(timer);
    if (!state.running) return;
    timer = setTimeout(async () => {
      await sendOnce();
      schedule();
    }, state.interval * 1000);
  }

  async function startJob(settings) {
    stopJob(false);
    state.message = String(settings.message || "").trim();
    state.interval = Math.max(5, Math.min(86400, Number(settings.interval) || 60));
    state.maxAttempts = Math.max(0, Math.floor(Number(settings.maxAttempts) || 0));
    state.attempts = 0;
    state.running = Boolean(state.message);
    state.lastResult = state.running ? "启动中" : "消息不能为空";
    renderOverlay();
    if (!state.running) return;
    await sendOnce();
    schedule();
  }

  function stopJob(update = true) {
    state.running = false;
    clearTimeout(timer);
    timer = null;
    if (update) state.lastResult = state.attempts ? "已停止" : "准备就绪";
    renderOverlay();
  }

  function renderOverlay() {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "gpt-continuum-overlay";
      overlay.style.cssText = "position:fixed;right:14px;top:14px;z-index:2147483647;padding:8px 10px;border-radius:10px;background:rgba(32,33,35,.92);color:#fff;font:12px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.22);max-width:260px;pointer-events:none";
      document.documentElement.appendChild(overlay);
    }
    overlay.textContent = state.running
      ? `GPT Continuum · ${state.attempts} 次 · 每 ${state.interval} 秒\n${state.lastResult}`
      : `GPT Continuum · ${state.lastResult}`;
    overlay.style.opacity = state.running || state.attempts ? "1" : ".55";
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "START_JOB") {
      startJob(message.settings).then(() => sendResponse({ ok: true }));
      return true;
    }
    if (message?.type === "STOP_JOB") {
      stopJob();
      sendResponse({ ok: true });
      return false;
    }
    if (message?.type === "GET_STATE") {
      sendResponse({ ...state });
      return false;
    }
    return false;
  });

  renderOverlay();
  chrome.runtime.sendMessage({ type: "CONTENT_READY" }).catch(() => {});
})();
