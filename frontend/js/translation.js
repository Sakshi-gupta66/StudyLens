/* =========================================================
   StudyLens — Translation
   ========================================================= */

const LANGUAGES = [
  { name: "English", flag: "🇺🇸" },
  { name: "Hindi", flag: "🇮🇳" },
  { name: "Spanish", flag: "🇪🇸" },
  { name: "French", flag: "🇫🇷" },
  { name: "German", flag: "🇩🇪" },
  { name: "Japanese", flag: "🇯🇵" },
  { name: "Chinese", flag: "🇨🇳" },
  { name: "Korean", flag: "🇰🇷" },
  { name: "Arabic", flag: "🇸🇦" },
  { name: "Portuguese", flag: "🇵🇹" },
  { name: "Bengali", flag: "🇧🇩" },
  { name: "Tamil", flag: "🇮🇳" },
  { name: "Telugu", flag: "🇮🇳" },
  { name: "Marathi", flag: "🇮🇳" },
];

function initTranslation() {
  document.getElementById("nav-translate-trigger")?.addEventListener("click", openTranslationModal);
  document.getElementById("open-translate-btn")?.addEventListener("click", openTranslationModal);
}

function openTranslationModal() {
  if (!hasDocument()) {
    toast("Upload a PDF before starting a study session.", "warning");
    return;
  }

  let selected = appState.selectedLanguage;

  const languageGridHtml = LANGUAGES.map(
    (lang) => `
      <button class="language-option ${selected === lang.name ? "language-option--selected" : ""}" data-lang="${lang.name}">
        <span class="language-option__flag">${lang.flag}</span>
        <span class="language-option__name">${lang.name}</span>
      </button>`
  ).join("");

  openModal(
    `
    <div class="modal__header">
      <div>
        <h2>Translate document</h2>
        <p>Choose the language you want to study in.</p>
      </div>
      <button class="modal__close" aria-label="Close"><svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
    </div>
    <div class="modal__body">
      <div class="language-grid" id="language-selector">${languageGridHtml}</div>
    </div>
    <div class="modal__footer">
      <button class="btn btn--ghost" data-modal-dismiss>Cancel</button>
      <button class="btn btn--primary" id="translate-button" ${selected ? "" : "disabled"}>Translate</button>
    </div>
  `,
    { wide: true, id: "translation-modal" }
  );

  document.querySelectorAll("#language-selector .language-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#language-selector .language-option").forEach((b) => b.classList.remove("language-option--selected"));
      btn.classList.add("language-option--selected");
      selected = btn.dataset.lang;
      document.getElementById("translate-button").disabled = false;
    });
  });

  document.getElementById("translate-button").addEventListener("click", () => {
    setState({ selectedLanguage: selected });
    runTranslation(selected);
  });
}

async function runTranslation(language) {
  const modalBody = document.querySelector("#modal-container .modal__body");
  const modalFooter = document.querySelector("#modal-container .modal__footer");
  if (modalBody) {
    modalBody.innerHTML = `
      <div style="text-align:center; padding: var(--space-8) 0;">
        <span class="spinner" style="margin: 0 auto var(--space-4);"></span>
        <p style="color: var(--text-secondary); font-size: var(--fs-sm);">Translating your document into ${escapeHtml(language)}...</p>
      </div>
    `;
  }
  if (modalFooter) modalFooter.innerHTML = "";

  try {
    const result = await api.translate(language);
    setState({ translation: { text: result.translation || "", language: result.target_language || language } });
    closeModal();
    goToView("translation");
    renderTranslationResult();
    toast("Translation ready", "success");
  } catch (err) {
    const msg = err instanceof ApiError ? err.friendlyMessage : "Translation couldn't be completed. Please try again.";
    if (modalBody) {
      modalBody.innerHTML = renderInlineError(msg, "openTranslationModal()");
    }
    toast(msg, "error");
  }
}

function renderTranslationResult() {
  const container = document.getElementById("translation-content");
  const t = appState.translation;

  if (!t) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h9M8.5 4v2.5M6 6c.5 3 2.3 5.5 5 7M11 6c-.8 4-3.3 7-7 9M13 20l4-9 4 9M14.3 17h5.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h3>Study in another language</h3>
        <p>Translate this document's content into one of fourteen languages.</p>
        <button class="btn btn--primary" id="open-translate-btn">Translate document</button>
      </div>
    `;
    document.getElementById("open-translate-btn").addEventListener("click", openTranslationModal);
    return;
  }

  container.innerHTML = `
    <div class="content-meta-bar">
      <span>Translated to ${escapeHtml(t.language)}</span>
    </div>
    <div class="translation-result">
      <div class="translation-result__toolbar">
        <input type="text" class="translation-result__search" id="translation-search" placeholder="Search within translation..." />
        <button class="btn btn--secondary btn--sm" id="copy-translation-btn">Copy</button>
        <button class="btn btn--ghost btn--sm" id="retranslate-btn">Change language</button>
      </div>
      <div class="reading-surface" id="translation-text">${renderMarkdown(t.text)}</div>
    </div>
  `;

  document.getElementById("copy-translation-btn").addEventListener("click", (e) => copyPlainText(t.text, e.currentTarget));
  document.getElementById("retranslate-btn").addEventListener("click", openTranslationModal);
  document.getElementById("translation-search").addEventListener("input", (e) => searchWithinTranslation(e.target.value));
}

function searchWithinTranslation(query) {
  const el = document.getElementById("translation-text");
  const t = appState.translation;
  if (!el || !t) return;

  if (!query.trim()) {
    el.innerHTML = renderMarkdown(t.text);
    return;
  }

  const html = renderMarkdown(t.text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  el.innerHTML = html.replace(/>([^<]+)</g, (match, text) => `>${text.replace(regex, '<mark class="search-hit">$1</mark>')}<`);
}

window.initTranslation = initTranslation;
window.openTranslationModal = openTranslationModal;
window.renderTranslationResult = renderTranslationResult;
