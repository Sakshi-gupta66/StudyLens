/* =========================================================
   StudyLens — Summary
   ========================================================= */

function initSummary() {
  document.getElementById("generate-summary-btn")?.addEventListener("click", () => loadSummary(Boolean(appState.summary)));
}

async function ensureSummaryLoaded() {
  if (appState.summary) {
    renderSummaryContent();
    return;
  }
  await loadSummary(false);
}

async function loadSummary(isRegenerate) {
  const container = document.getElementById("summary-content");
  if (!hasDocument()) {
    toast("Upload a PDF before starting a study session.", "warning");
    return;
  }
  container.innerHTML = renderSkeleton();
  document.getElementById("summary-actions").innerHTML = "";

  try {
    const result = await api.generateSummary();
    setState({ summary: result.summary || "" });
    renderSummaryContent();
    toast(isRegenerate ? "Summary regenerated" : "Summary generated", "success");
  } catch (err) {
    const msg = err instanceof ApiError ? err.friendlyMessage : "We couldn't generate a summary. Please try again.";
    container.innerHTML = renderInlineError(msg, "loadSummary(false)");
    toast(msg, "error");
  }
}

function renderSummaryContent() {
  const container = document.getElementById("summary-content");
  const actions = document.getElementById("summary-actions");
  const text = appState.summary || "";
  const minutes = estimateReadingTime(text);

  container.innerHTML = `
    <div class="content-meta-bar">
      <span><svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>${minutes} min read</span>
      <span><svg viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>${escapeHtml(appState.currentDocument?.filename || "")}</span>
    </div>
    <div class="reading-surface">${renderMarkdown(text)}</div>
    <div class="content-actions">
      <button class="btn btn--secondary btn--sm" id="copy-summary-btn">Copy</button>
      <button class="btn btn--secondary btn--sm" id="download-summary-btn">Download</button>
      <button class="btn btn--ghost btn--sm" id="regenerate-summary-btn">Regenerate</button>
    </div>
  `;

  document.getElementById("copy-summary-btn").addEventListener("click", (e) => copyPlainText(text, e.currentTarget));
  document.getElementById("download-summary-btn").addEventListener("click", () =>
    downloadAsFile(text, `${(appState.currentDocument?.filename || "summary").replace(/\.pdf$/i, "")}-summary.txt`)
  );
  document.getElementById("regenerate-summary-btn").addEventListener("click", () => loadSummary(true));
  actions.innerHTML = "";
}

window.initSummary = initSummary;
window.ensureSummaryLoaded = ensureSummaryLoaded;
window.loadSummary = loadSummary;
