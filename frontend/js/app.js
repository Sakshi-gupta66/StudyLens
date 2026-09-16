/* =========================================================
   StudyLens — App bootstrap
   ========================================================= */

const WORKSPACE_TOOLS = [
  { id: "ask", label: "Ask AI", desc: "Chat with your document" },
  { id: "summary", label: "Summary", desc: "Quick overview" },
  { id: "notes", label: "Notes", desc: "Structured key points" },
  { id: "quiz", label: "Quiz", desc: "Test your understanding" },
  { id: "translate", label: "Translate", desc: "Study in another language" },
];

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavigation();
  initUpload();
  initChat();
  initSummary();
  initNotes();
  initQuiz();
  initTranslation();
  initWorkspaceTools();
  initFeatureGrid();
  initGlobalSearch();
  initKeyboardShortcuts();
  initThemeToggleButton();
  initMiscUi();
  updateTopbarDocument();
  checkBackendHealth();

  document.getElementById("upload-button")?.addEventListener("click", () => {
    document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("pdf-file-input")?.click();
  });

  document.getElementById("explore-demo-btn")?.addEventListener("click", () => {
    toast("A guided demo document is coming soon — try uploading your own PDF for now.", "info");
  });
});

const FEATURE_CARDS = [
  { title: "Ask anything", desc: "Grounded, source-cited answers from your own document.", icon: "ask" },
  { title: "Smart summaries", desc: "A clear, readable overview in seconds.", icon: "summary" },
  { title: "Study notes", desc: "Key concepts and definitions, structured for revision.", icon: "notes" },
  { title: "AI quizzes", desc: "Test your recall with generated questions.", icon: "quiz" },
  { title: "Multilingual learning", desc: "Study the same material in 14 languages.", icon: "translate" },
  { title: "Source-grounded answers", desc: "Every answer points back to the exact pages.", icon: "ask" },
  { title: "Flashcards", desc: "Turn key facts into spaced-repetition cards.", icon: "notes", soon: true },
  { title: "Personalized learning", desc: "A study path that adapts to your gaps.", icon: "quiz", soon: true },
  { title: "Progress tracking", desc: "See how your understanding improves over time.", icon: "summary", soon: true },
  { title: "Semantic search", desc: "Find the exact passage you're thinking of.", icon: "translate", soon: true },
];

function initFeatureGrid() {
  const grid = document.getElementById("feature-grid");
  if (!grid) return;
  grid.innerHTML = FEATURE_CARDS.map(
    (f) => `
      <div class="feature-card ${f.soon ? "feature-card--soon" : ""}">
        <span class="feature-card__icon">${toolIcon(f.icon)}</span>
        <h3>${f.title} ${f.soon ? '<span class="badge badge--soon">Soon</span>' : ""}</h3>
        <p>${f.desc}</p>
      </div>`
  ).join("");
}

function initThemeToggleButton() {
  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
}

async function checkBackendHealth() {
  try {
    await api.healthCheck();
    setState({ backendOnline: true });
  } catch (err) {
    setState({ backendOnline: false });
    toast("StudyLens couldn't connect to the AI engine. Make sure the backend is running.", "error", { duration: 6000 });
    console.error("[health] backend unreachable", err);
  }
}

/* ---------------- Workspace tool switching ---------------- */

function initWorkspaceTools() {
  const container = document.getElementById("workspace-tools-list");
  if (!container) return;

  container.innerHTML = WORKSPACE_TOOLS.map(
    (tool) => `
      <button class="tool-card" data-tool="${tool.id}">
        <span class="tool-card__icon">${toolIcon(tool.id)}</span>
        <span>
          <div class="tool-card__label">${tool.label}</div>
          <div class="tool-card__desc">${tool.desc}</div>
        </span>
      </button>`
  ).join("");

  container.querySelectorAll(".tool-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tool = btn.dataset.tool;
      goToView(tool === "translate" ? "translation" : tool);
    });
  });
}

function toolIcon(id) {
  const icons = {
    ask: '<svg viewBox="0 0 16 16" fill="none"><path d="M2 3h12v8H6l-3 3v-3H2V3z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    summary: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 3h10M3 7h10M3 11h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    notes: '<svg viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.5 8h4M6.5 10.5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    quiz: '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.3"/><path d="M6.2 6.3c0-1.1.9-1.8 1.9-1.8s1.9.6 1.9 1.5c0 1.2-1.9 1.3-1.9 2.6M8 11v.01" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    translate: '<svg viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5h6M5.5 3v1.5M4 4.5c.4 2 1.5 3.6 3.3 4.7M7.3 4.5c-.6 2.6-2.2 4.6-4.6 6M9 12.5l2.5-5.5 2.5 5.5M9.6 10.7h3.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  return icons[id] || icons.ask;
}

function renderWorkspaceOverview() {
  const sidebar = document.getElementById("workspace-sidebar");
  const main = document.getElementById("workspace-main");
  const doc = appState.currentDocument;
  if (!sidebar || !main) return;

  sidebar.innerHTML = `<div class="card" style="padding: var(--space-4);"></div>`;
  if (doc) {
    sidebar.querySelector(".card").appendChild(buildDocumentCard(doc));
  }
  sidebar.innerHTML += `
    <div class="card" style="margin-top: var(--space-4);">
      <h3 style="font-size: var(--fs-sm); margin-bottom: var(--space-3); color: var(--text-secondary);">This session</h3>
      <div style="display:flex; flex-direction:column; gap: var(--space-2); font-size: var(--fs-sm);">
        <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-tertiary);">Questions asked</span><span>${appState.chatMessages.filter((m) => m.role === "user").length}</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-tertiary);">Summary</span><span>${appState.summary ? "Ready" : "Not yet"}</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-tertiary);">Notes</span><span>${appState.notes ? "Ready" : "Not yet"}</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:var(--text-tertiary);">Quiz</span><span>${appState.quiz ? "Ready" : "Not yet"}</span></div>
      </div>
    </div>
  `;

  main.innerHTML = `
    <h2 style="font-family: var(--font-display); font-size: var(--fs-xl); margin-bottom: var(--space-2);">
      What do you want to do with this document?
    </h2>
    <p style="color: var(--text-secondary); margin-bottom: var(--space-6); max-width: 52ch;">
      Pick a tool from the right to get started, or jump straight into a conversation with your PDF.
    </p>
    <div class="feature-grid" id="workspace-shortcut-grid"></div>
  `;

  const shortcuts = [
    { id: "ask", title: "Ask AI", desc: "Get grounded answers with page references.", icon: "ask" },
    { id: "summary", title: "Summary", desc: "A concise overview of the whole document.", icon: "summary" },
    { id: "notes", title: "Notes", desc: "Key concepts, definitions, and takeaways.", icon: "notes" },
    { id: "quiz", title: "Quiz", desc: "Test yourself with generated questions.", icon: "quiz" },
    { id: "translation", title: "Translate", desc: "Study the material in another language.", icon: "translate" },
  ];

  const grid = document.getElementById("workspace-shortcut-grid");
  grid.innerHTML = shortcuts
    .map(
      (s) => `
      <button class="feature-card card--interactive" data-shortcut="${s.id}" style="text-align:left; border:1px solid var(--border); cursor:pointer;">
        <span class="feature-card__icon">${toolIcon(s.icon)}</span>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </button>`
    )
    .join("");

  grid.querySelectorAll("[data-shortcut]").forEach((btn) => {
    btn.addEventListener("click", () => goToView(btn.dataset.shortcut));
  });
}

window.renderWorkspaceOverview = renderWorkspaceOverview;

/* ---------------- Global search (Cmd/Ctrl+K) ---------------- */

const SEARCH_ACTIONS = [
  { label: "Ask AI", view: "ask" },
  { label: "Generate summary", view: "summary" },
  { label: "Generate notes", view: "notes" },
  { label: "Take a quiz", view: "quiz" },
  { label: "Translate document", view: "translation" },
  { label: "Upload a new document", view: "dashboard" },
  { label: "Settings", view: "dashboard" },
];

function initGlobalSearch() {
  document.getElementById("global-search")?.addEventListener("click", openGlobalSearch);
}

function openGlobalSearch() {
  openModal(`
    <div class="search-modal-input">
      <svg viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.4"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      <input type="text" id="search-modal-field" placeholder="Search actions..." autocomplete="off" />
    </div>
    <div class="modal__body" id="search-results" style="padding-top: var(--space-2);"></div>
  `);
  renderSearchResults("");
  document.getElementById("search-modal-field").addEventListener("input", (e) => renderSearchResults(e.target.value));
}

function renderSearchResults(query) {
  const results = document.getElementById("search-results");
  if (!results) return;
  const q = query.trim().toLowerCase();
  const matches = SEARCH_ACTIONS.filter((a) => a.label.toLowerCase().includes(q));

  if (!matches.length) {
    results.innerHTML = `<p style="color: var(--text-tertiary); font-size: var(--fs-sm); padding: var(--space-4) 0;">No matching actions.</p>`;
    return;
  }

  results.innerHTML = matches
    .map(
      (a) => `<button class="tool-card" style="margin-bottom: 4px;" data-search-view="${a.view}">
        <span class="tool-card__icon">${toolIcon(a.view === "translation" ? "translate" : a.view)}</span>
        <span class="tool-card__label">${a.label}</span>
      </button>`
    )
    .join("");

  results.querySelectorAll("[data-search-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal();
      goToView(btn.dataset.searchView);
    });
  });
}

/* ---------------- Keyboard shortcuts ---------------- */

function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openGlobalSearch();
    }
  });
}

/* ---------------- Misc small UI wiring ---------------- */

function initMiscUi() {
  document.getElementById("notification-button")?.addEventListener("click", () => {
    toast("You're all caught up — no new notifications.", "info");
  });
  document.getElementById("profile-button")?.addEventListener("click", () => {
    toast("Profile settings are coming soon.", "info");
  });
}
