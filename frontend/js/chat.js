/* =========================================================
   StudyLens — Ask AI (chat)
   ========================================================= */

let chatMsgIdCounter = 0;
let lastQuestionAsked = null;

function initChat() {
  const input = document.getElementById("chat-input");
  const askBtn = document.getElementById("ask-button");
  if (!input || !askBtn) return;

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
    askBtn.disabled = input.value.trim().length === 0;
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  });

  askBtn.addEventListener("click", submitQuestion);
  askBtn.disabled = true;

  renderChatMessages();
}

async function submitQuestion() {
  const input = document.getElementById("chat-input");
  const question = input.value.trim();
  if (!question) return;

  if (!hasDocument()) {
    toast("Upload a PDF before starting a study session.", "warning");
    return;
  }

  input.value = "";
  input.style.height = "auto";
  document.getElementById("ask-button").disabled = true;
  lastQuestionAsked = question;

  addChatMessage("user", question);
  showTypingIndicator(true);

  try {
    const result = await api.askQuestion(question);
    showTypingIndicator(false);
    addChatMessage("assistant", result.answer || "I couldn't find an answer to that.", result.sources || []);
  } catch (err) {
    showTypingIndicator(false);
    const msg = err instanceof ApiError ? err.friendlyMessage : "Something went wrong. Please try again.";
    addChatMessage("assistant", msg, [], { isError: true });
    toast(msg, "error");
  }
}

function addChatMessage(role, text, sources = [], opts = {}) {
  const id = `msg-${++chatMsgIdCounter}`;
  appState.chatMessages.push({ id, role, text, sources, isError: !!opts.isError });
  renderChatMessages();
  scrollChatToBottom();
  return id;
}

function renderChatMessages() {
  const container = document.getElementById("chat-messages");
  if (!container) return;

  if (appState.chatMessages.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding-top: var(--space-8);">
        <div class="empty-state__icon">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5c0-1.4 1.1-2.3 2.5-2.3s2.5.8 2.5 2c0 1.6-2.5 1.7-2.5 3.5M12 16v.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <h3>Ask anything about your document</h3>
        <p>Try "What is the main argument?" or "Summarize chapter 2 in a sentence."</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appState.chatMessages.map(renderMessageHtml).join("");

  container.querySelectorAll("[data-copy-msg]").forEach((btn) => {
    btn.addEventListener("click", () => copyMessage(btn.dataset.copyMsg, btn));
  });
  container.querySelectorAll("[data-regenerate-msg]").forEach((btn) => {
    btn.addEventListener("click", regenerateLast);
  });
  container.querySelectorAll("[data-source-chip]").forEach((chip) => {
    chip.addEventListener("click", () => openSourceModal(chip.dataset.pages, chip.dataset.score));
  });

  renderSourcesPanel();
}

function renderSourcesPanel() {
  const body = document.getElementById("sources-panel-body");
  if (!body) return;

  const lastWithSources = [...appState.chatMessages].reverse().find((m) => m.role === "assistant" && m.sources && m.sources.length);

  if (!lastWithSources) {
    body.innerHTML = `
      <div class="empty-state" style="padding: var(--space-6) var(--space-3);">
        <div class="empty-state__icon">
          <svg viewBox="0 0 24 24" fill="none"><path d="M6 3h9l4 4v14H6V3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </div>
        <p style="margin-bottom:0;">Ask a question to see which pages the answer came from.</p>
      </div>
    `;
    return;
  }

  body.innerHTML = lastWithSources.sources
    .map((s) => {
      const pages = formatPages(s.pages);
      return `
        <div class="source" data-panel-source data-pages="${escapeHtml(pages)}" data-score="${s.rerank_score ?? ""}">
          <div class="source__header">
            <svg viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
            Pages ${escapeHtml(pages)}
          </div>
          <div class="source__pages">${escapeHtml(appState.currentDocument?.filename || "")}</div>
          <span class="source__link">
            View source
            <svg viewBox="0 0 12 12" fill="none"><path d="M3 9l6-6M4 3h5v5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>`;
    })
    .join("");

  body.querySelectorAll("[data-panel-source]").forEach((el) => {
    el.addEventListener("click", () => openSourceModal(el.dataset.pages, el.dataset.score));
  });
}

function renderMessageHtml(msg) {
  const initials = msg.role === "user" ? "You" : "AI";
  const bodyHtml = msg.role === "assistant" ? renderMarkdown(msg.text) : `<p>${escapeHtml(msg.text)}</p>`;

  const sourcesHtml =
    msg.sources && msg.sources.length
      ? `<div class="chat__sources">${msg.sources
          .map((s) => {
            const pages = formatPages(s.pages);
            return `<button class="chat__source-chip" data-source-chip data-pages="${escapeHtml(pages)}" data-score="${s.rerank_score ?? ""}">
              <svg viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
              Pages ${escapeHtml(pages)}
            </button>`;
          })
          .join("")}</div>`
      : "";

  const actionsHtml =
    msg.role === "assistant"
      ? `<div class="chat__message-actions">
          <button data-copy-msg="${msg.id}">
            <svg viewBox="0 0 16 16" fill="none"><rect x="5.5" y="5.5" width="8" height="8.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M3 10V3.5A1.5 1.5 0 014.5 2H10" stroke="currentColor" stroke-width="1.3"/></svg>
            Copy
          </button>
          <button data-regenerate-msg="${msg.id}">
            <svg viewBox="0 0 16 16" fill="none"><path d="M13.5 8a5.5 5.5 0 11-1.6-3.9M13.5 2.5V6H10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Regenerate
          </button>
        </div>`
      : "";

  return `
    <div class="chat__message chat__message--${msg.role}" data-msg-id="${msg.id}">
      <div class="chat__avatar">${initials}</div>
      <div>
        <div class="chat__bubble">${bodyHtml}</div>
        ${sourcesHtml}
        ${actionsHtml}
      </div>
    </div>
  `;
}

function formatPages(pages) {
  if (!Array.isArray(pages) || pages.length === 0) return "—";
  if (pages.length === 1) return String(pages[0]);
  const sorted = [...pages].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const isContiguous = sorted.every((p, i) => i === 0 || p === sorted[i - 1] + 1);
  return isContiguous ? `${first}–${last}` : sorted.join(", ");
}

function showTypingIndicator(visible) {
  const el = document.getElementById("typing-indicator");
  if (!el) return;
  el.classList.toggle("is-visible", visible);
  if (visible) scrollChatToBottom();
}

function scrollChatToBottom() {
  const container = document.getElementById("chat-messages");
  if (container) container.scrollTop = container.scrollHeight;
}

function copyMessage(msgId, btnEl) {
  const msg = appState.chatMessages.find((m) => m.id === msgId);
  if (!msg) return;
  navigator.clipboard
    .writeText(msg.text)
    .then(() => {
      const original = btnEl.innerHTML;
      btnEl.innerHTML = "Copied";
      btnEl.classList.add("copy-flash");
      setTimeout(() => {
        btnEl.innerHTML = original;
        btnEl.classList.remove("copy-flash");
      }, 1500);
    })
    .catch(() => toast("Couldn't copy to clipboard", "error"));
}

async function regenerateLast() {
  if (!lastQuestionAsked) return;
  showTypingIndicator(true);
  try {
    const result = await api.askQuestion(lastQuestionAsked);
    showTypingIndicator(false);
    addChatMessage("assistant", result.answer || "I couldn't find an answer to that.", result.sources || []);
  } catch (err) {
    showTypingIndicator(false);
    const msg = err instanceof ApiError ? err.friendlyMessage : "Something went wrong. Please try again.";
    toast(msg, "error");
  }
}

function openSourceModal(pages, score) {
  const scoreHtml = score
    ? `<p class="source__debug" style="margin-top: var(--space-3);">Relevance score: ${escapeHtml(String(score))}</p>`
    : "";
  openModal(`
    <div class="modal__header">
      <div>
        <h2>Source</h2>
        <p>Referenced from your document</p>
      </div>
      <button class="modal__close" aria-label="Close"><svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
    </div>
    <div class="modal__body">
      <div class="source">
        <div class="source__header">
          <svg viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
          Pages ${escapeHtml(pages)}
        </div>
        <p style="margin-top: var(--space-3); color: var(--text-secondary); font-size: var(--fs-sm);">
          Page-level preview isn't available yet — this is where a snippet of the source page will appear in a future update.
        </p>
        ${scoreHtml}
      </div>
    </div>
  `);
}

window.initChat = initChat;
window.renderChatMessages = renderChatMessages;
