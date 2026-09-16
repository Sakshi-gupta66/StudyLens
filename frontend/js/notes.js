/* =========================================================
   StudyLens — Notes
   ========================================================= */

function initNotes() {
  document.getElementById("generate-notes-btn")?.addEventListener("click", () => loadNotes(Boolean(appState.notes)));
}

async function ensureNotesLoaded() {
  if (appState.notes) {
    renderNotesContent();
    return;
  }
  await loadNotes(false);
}

async function loadNotes(isRegenerate) {
  const container = document.getElementById("notes-content");
  if (!hasDocument()) {
    toast("Upload a PDF before starting a study session.", "warning");
    return;
  }
  container.innerHTML = renderSkeleton(8);
  document.getElementById("notes-actions").innerHTML = "";

  try {
    const result = await api.generateNotes();
    setState({ notes: result.notes || "" });
    renderNotesContent();
    toast(isRegenerate ? "Notes regenerated" : "Notes generated", "success");
  } catch (err) {
    const msg = err instanceof ApiError ? err.friendlyMessage : "We couldn't generate notes. Please try again.";
    container.innerHTML = renderInlineError(msg, "loadNotes(false)");
    toast(msg, "error");
  }
}

function renderNotesContent() {
  const container = document.getElementById("notes-content");
  const actions = document.getElementById("notes-actions");
  const text = appState.notes || "";

  container.innerHTML = `<div class="reading-surface">${renderMarkdown(text)}</div>
    <div class="content-actions">
      <button class="btn btn--secondary btn--sm" id="copy-notes-btn">Copy</button>
      <button class="btn btn--secondary btn--sm" id="download-notes-btn">Download</button>
      <button class="btn btn--ghost btn--sm" id="regenerate-notes-btn">Regenerate</button>
    </div>
  `;

  document.getElementById("copy-notes-btn").addEventListener("click", (e) => copyPlainText(text, e.currentTarget));
  document.getElementById("download-notes-btn").addEventListener("click", () =>
    downloadAsFile(text, `${(appState.currentDocument?.filename || "notes").replace(/\.pdf$/i, "")}-notes.txt`)
  );
  document.getElementById("regenerate-notes-btn").addEventListener("click", () => loadNotes(true));
  actions.innerHTML = "";
}

window.initNotes = initNotes;
window.ensureNotesLoaded = ensureNotesLoaded;
window.loadNotes = loadNotes;
