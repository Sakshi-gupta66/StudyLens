import { api } from "./api.js";
import { $, $$, toast, loading, markdown, escapeHTML } from "./ui.js";
const state = {
  currentDocument: null,
  activeView: "dashboard",
  isProcessing: false,
  chatMessages: [],
  lastAnswer: null,
  sources: [],
  summary: null,
  notes: null,
  quiz: null,
  translation: null,
  selectedLanguage: "Hindi",
  theme: localStorage.getItem("studylens-theme") || "dark",
};
const future = {
  flashcards: [
    "Flashcards",
    "Turn important ideas into memory-friendly cards.",
  ],
  search: [
    "Semantic Search",
    "Search your document by meaning, not just matching words.",
  ],
  progress: [
    "Learning Progress",
    "Track quiz performance, weak concepts and revision over time.",
  ],
  settings: ["Settings", "Personalize your study experience."],
  profile: ["Profile", "Your StudyLens learner profile."],
};
document.documentElement.dataset.theme = state.theme;
function setTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = state.theme;
  localStorage.setItem("studylens-theme", state.theme);
}
function renderDocument() {
  const d = state.currentDocument;
  if (!d) {
    $("#current-document-name").textContent = "No document";
    $("#document-status").textContent = "No document";
    return;
  }
  $("#current-document-name").textContent = d.filename;
  $("#document-status").textContent = "Ready";
  $("#health-dot").classList.add("healthy");
  $("#workspace-doc-name").textContent = d.filename;
  $("#workspace-doc-meta").textContent =
    `${d.pages} pages · ${d.chunks} chunks`;
  $("#document-card").classList.remove("hidden");
  $("#document-card").innerHTML =
    `<div class="document-card__main"><span class="document-card__icon">PDF</span><div><strong>${escapeHTML(d.filename)}</strong><small>Document ready for study</small></div></div><div class="document-card__stats"><span>${d.pages} pages</span><span>${d.chunks} chunks</span><button class="button button--primary" id="start-studying">Start Studying</button></div>`;
  $("#start-studying").onclick = () => navigate("ask");
}
function navigate(view) {
  state.activeView = view;
  $$(".sidebar__nav-item").forEach((b) =>
    b.classList.toggle("sidebar__nav-item--active", b.dataset.view === view),
  );
  $$(".view").forEach((v) => v.classList.remove("view--active"));
  const direct = $(`#${view}-view`);
  if (direct) {
    direct.classList.add("view--active");
  } else {
    $("#coming-view").classList.add("view--active");
    $("#coming-title").textContent = future[view]?.[0] || "Coming soon";
    $("#coming-copy").textContent =
      future[view]?.[1] ||
      "This capability will connect when its backend contract exists.";
  }
  if (["ask", "summary", "notes", "quiz", "translation"].includes(view)) {
    const w = $("#workspace-view");
    w.classList.add("view--active");
    $$(".workspace-view").forEach((v) => v.classList.remove("view--active"));
    $(`#${view}-view`).classList.add("view--active");
    $("#dashboard-view").classList.remove("view--active");
  } else if (view === "dashboard" || view === "documents" || future[view]) {
    $("#workspace-view").classList.remove("view--active");
  }
  $("#mobile-menu").click?.();
  if (view === "ask") renderAsk();
  if (view === "summary") renderSummary();
  if (view === "notes") renderNotes();
  if (view === "quiz") renderQuiz();
  if (view === "translation") renderTranslation();
}
function noDoc() {
  toast("Upload a PDF before starting a study session", "error");
  navigate("dashboard");
  document
    .querySelector("#upload-zone")
    ?.scrollIntoView({ behavior: "smooth" });
}
async function upload(file) {
  if (!file) return;
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    toast("Please choose a PDF file", "error");
    return;
  }
  state.isProcessing = true;
  $("#upload-zone").classList.add("upload-zone--processing");
  const steps = [
    "Processing document…",
    "Extracting pages…",
    "Creating chunks…",
    "Generating embeddings…",
    "Building knowledge index…",
  ];
  let i = 0;
  $("#upload-status").textContent = steps[0];
  const timer = setInterval(() => {
    $("#upload-status").textContent = steps[Math.min(++i, steps.length - 1)];
  }, 1100);
  try {
    const data = await api.uploadPDF(file);
    state.currentDocument = {
      filename: data.filename || file.name,
      pages: data.pages ?? 0,
      chunks: data.chunks ?? 0,
    };
    renderDocument();
    toast("PDF uploaded successfully");
    navigate("ask");
  } catch (e) {
    toast(
      e.message === "NETWORK_ERROR"
        ? "StudyLens couldn't connect to the AI engine."
        : "We couldn't process this PDF. Please try again.",
      "error",
    );
  } finally {
    clearInterval(timer);
    state.isProcessing = false;
    $("#upload-zone").classList.remove("upload-zone--processing");
    $("#upload-status").textContent = "PDF files only";
  }
}
function renderAsk() {
  const root = $("#ask-view");
  root.innerHTML = `<div class="workspace-header"><h2>AI Study Assistant</h2><p>Ask anything about your document.</p></div><div class="chat"><div id="chat-messages" class="chat__messages"></div><div id="sources-panel" class="sources-panel hidden"></div><div class="chat__composer"><textarea id="chat-input" class="chat__input" rows="1" placeholder="Ask something about your PDF…" aria-label="Ask something about your PDF"></textarea><button id="ask-button" class="ask-send" aria-label="Send question">➤</button></div></div>`;
  const box = $("#chat-messages");
  if (!state.chatMessages.length)
    box.innerHTML =
      '<div class="chat__empty"><div class="empty-icon">✦</div><h2>What do you want to understand?</h2><p>Ask a concept, request an explanation, or dig into a specific idea from your PDF.</p></div>';
  else state.chatMessages.forEach(addMessage);
  $("#ask-button").onclick = sendQuestion;
  $("#chat-input").onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };
}
function addMessage(m) {
  const box = $("#chat-messages");
  if (!box) return;
  const empty = box.querySelector(".chat__empty");
  empty?.remove();
  const el = document.createElement("div");
  el.className = `chat__message chat__message--${m.role}`;
  el.innerHTML = `<div class="chat__avatar">${m.role === "user" ? "M" : "S"}</div><div class="chat__bubble">${m.role === "assistant" ? markdown(m.content) : escapeHTML(m.content).replace(/\n/g, "<br>")}</div>`;
  box.append(el);
  box.scrollTop = box.scrollHeight;
}
async function sendQuestion() {
  if (!state.currentDocument) return noDoc();
  const input = $("#chat-input");
  const q = input.value.trim();
  if (!q) return;
  input.value = "";
  state.chatMessages.push({ role: "user", content: q });
  addMessage({ role: "user", content: q });
  const typing = document.createElement("div");
  typing.className = "chat__message";
  typing.innerHTML =
    '<div class="chat__avatar">S</div><div class="chat__bubble">Thinking…</div>';
  $("#chat-messages").append(typing);
  try {
    const data = await api.askQuestion(q);
    typing.remove();
    state.lastAnswer = data.answer || "";
    state.sources = Array.isArray(data.sources) ? data.sources : [];
    state.chatMessages.push({ role: "assistant", content: state.lastAnswer });
    addMessage({ role: "assistant", content: state.lastAnswer });
    renderSources();
  } catch (e) {
    typing.remove();
    toast(
      e.message === "NETWORK_ERROR"
        ? "StudyLens couldn't connect to the AI engine."
        : "Unable to answer right now. Please try again.",
      "error",
    );
  }
}
function renderSources() {
  const p = $("#sources-panel");
  if (!p || !state.sources.length) return p?.classList.add("hidden");
  p.classList.remove("hidden");
  p.innerHTML =
    '<div class="sources-title">Sources</div>' +
    state.sources
      .map((s, i) => {
        const pages = Array.isArray(s.pages) ? s.pages : [];
        const label = pages.length
          ? `Pages ${Math.min(...pages)}${pages.length > 1 ? "–" + Math.max(...pages) : ""}`
          : "Source";
        return `<div class="source" data-source="${i}"><div class="source__header">📄 ${label}</div><span class="source__pages">View source →</span></div>`;
      })
      .join("");
  p.querySelectorAll(".source").forEach(
    (x) => (x.onclick = () => showSource(state.sources[+x.dataset.source])),
  );
}
function showSource(s) {
  const pages = Array.isArray(s.pages) ? s.pages : [];
  const label = pages.length
    ? `Pages ${Math.min(...pages)}${pages.length > 1 ? "–" + Math.max(...pages) : ""}`
    : "Referenced pages";
  openModal(
    "Source reference",
    `<p>Source: <strong>${escapeHTML(label)}</strong></p><p class="muted">Page-level PDF rendering is not available in the current backend. This preview is ready for a future page viewer.</p>`,
  );
}
async function generate(kind) {
  if (!state.currentDocument) return noDoc();
  const cfg = {
    summary: [
      "Generating summary…",
      "Creating a readable overview.",
      "generateSummary",
    ],
    notes: [
      "Creating study notes…",
      "Structuring the important concepts.",
      "generateNotes",
    ],
    quiz: [
      "Building your quiz…",
      "Preparing a knowledge check.",
      "generateQuiz",
    ],
  }[kind];
  loading(true, cfg[0], cfg[1]);
  try {
    const data = await api[cfg[2]]();
    state[kind] = data[kind] || "";
    toast(`${kind[0].toUpperCase() + kind.slice(1)} generated`);
    if (kind === "summary") renderSummary();
    if (kind === "notes") renderNotes();
    if (kind === "quiz") renderQuiz();
  } catch (e) {
    toast(
      e.message === "NETWORK_ERROR"
        ? "StudyLens couldn't connect to the AI engine."
        : `Couldn't generate ${kind}. Please try again.`,
      "error",
    );
  } finally {
    loading(false);
  }
}
function renderSummary() {
  const root = $("#summary-view");
  root.innerHTML = `<div class="content-card card"><div class="content-actions"><button class="button button--ghost" id="summary-generate">${state.summary ? "Regenerate" : "Generate summary"}</button><button class="button button--ghost" id="summary-copy">Copy</button></div><h1>AI Summary</h1><div class="content-card__subtitle">An intelligent overview of your document.</div><div class="prose">${state.summary ? markdown(state.summary) : '<div class="empty-state"><div class="empty-icon">◫</div><h2>Your summary will appear here.</h2><p>Generate an AI overview of the uploaded document.</p></div>'}</div></div>`;
  $("#summary-generate").onclick = () => generate("summary");
  $("#summary-copy").onclick = () => copyText(state.summary || "");
}
function renderNotes() {
  const root = $("#notes-view");
  root.innerHTML = `<div class="content-card card"><div class="content-actions"><button class="button button--ghost" id="notes-generate">${state.notes ? "Regenerate" : "Create notes"}</button><button class="button button--ghost" id="notes-copy">Copy</button></div><h1>Study Notes</h1><div class="content-card__subtitle">Concepts, definitions and important points from your document.</div><div class="prose">${state.notes ? markdown(state.notes) : '<div class="empty-state"><div class="empty-icon">☷</div><h2>Your notes will appear here.</h2><p>Turn dense material into a cleaner study sheet.</p></div>'}</div></div>`;
  $("#notes-generate").onclick = () => generate("notes");
  $("#notes-copy").onclick = () => copyText(state.notes || "");
}
function parseQuiz(raw) {
  if (!raw) return null;
  const blocks = raw
    .split(/\n(?=\s*(?:Question\s*)?\d+[.)])/i)
    .map((x) => x.trim())
    .filter(Boolean);
  const out = [];
  for (const b of blocks) {
    const q = b.match(
      /^(?:Question\s*)?\d+[.):\-]?\s*(.*?)(?=\n\s*[A-D][.)]|$)/is,
    );
    const opts = [...b.matchAll(/^\s*([A-D])[.)]\s*(.+)$/gim)];
    if (q && opts.length >= 2)
      out.push({
        question: q[1].trim(),
        options: opts.map((m) => m[2].trim()),
      });
  }
  return out.length ? out : null;
}
function renderQuiz() {
  const root = $("#quiz-view");
  const parsed = parseQuiz(state.quiz);
  if (!state.quiz) {
    root.innerHTML = `<div class="content-card card"><div class="quiz"><div class="eyebrow">Knowledge check</div><h1>Test your understanding.</h1><p>Generate a quiz from your current document.</p><button class="button button--primary" id="quiz-generate">Build quiz</button></div></div>`;
    $("#quiz-generate").onclick = () => generate("quiz");
    return;
  }
  if (!parsed) {
    root.innerHTML = `<div class="content-card card"><div class="quiz"><div class="eyebrow">Knowledge check</div><h1>Generated quiz</h1><div class="prose">${markdown(state.quiz)}</div><button class="button button--ghost" id="quiz-regenerate">Regenerate</button></div></div>`;
    $("#quiz-regenerate").onclick = () => generate("quiz");
    return;
  }
  root.innerHTML = `<div class="content-card card"><div class="quiz"><div class="quiz__top"><span id="quiz-progress">Question 1 of ${parsed.length}</span><span id="quiz-score">Score 0</span></div><div class="quiz__progress"><span id="quiz-progress-bar" style="width:${100 / parsed.length}%"></span></div><h2 id="quiz-question" class="quiz__question"></h2><div id="quiz-options"></div><div class="quiz__nav"><button class="button button--ghost" id="quiz-previous">Previous</button><button class="button button--primary" id="quiz-next">Next</button></div></div></div>`;
  let index = 0,
    score = 0,
    answers = {};
  function draw() {
    const item = parsed[index];
    $("#quiz-question").textContent = item.question;
    $("#quiz-progress").textContent =
      `Question ${index + 1} of ${parsed.length}`;
    $("#quiz-progress-bar").style.width =
      `${((index + 1) / parsed.length) * 100}%`;
    $("#quiz-options").innerHTML = item.options
      .map(
        (o, i) =>
          `<button class="quiz__option ${answers[index] === i ? "quiz__option--selected" : ""}">${String.fromCharCode(65 + i)}. ${escapeHTML(o)}</button>`,
      )
      .join("");
    $("#quiz-options")
      .querySelectorAll("button")
      .forEach(
        (b, i) =>
          (b.onclick = () => {
            answers[index] = i;
            draw();
          }),
      );
    $("#quiz-score").textContent = `Score ${score}`;
    $("#quiz-previous").disabled = index === 0;
    $("#quiz-next").textContent =
      index === parsed.length - 1 ? "Finish" : "Next";
  }
  $("#quiz-previous").onclick = () => {
    if (index > 0) {
      index--;
      draw();
    }
  };
  $("#quiz-next").onclick = () => {
    if (index < parsed.length - 1) {
      index++;
      draw();
    } else {
      openModal(
        "Quiz complete",
        `<h2>You answered ${Object.keys(answers).length} of ${parsed.length} questions.</h2><p>Your score can be persisted when quiz history is added to the backend.</p>`,
      );
    }
  };
  draw();
}
function renderTranslation() {
  const root = $("#translation-view");
  root.innerHTML = `<div class="content-card card"><div class="language-card"><div class="eyebrow">Multilingual learning</div><h1>Translate Document</h1><p>Choose the language you want to study in.</p><div class="language-grid">${["English", "Hindi", "Spanish", "French", "German", "Japanese", "Chinese", "Korean", "Arabic", "Portuguese", "Bengali", "Tamil", "Telugu", "Marathi"].map((x) => `<button class="language-option ${state.selectedLanguage === x ? "selected" : ""}" data-lang="${x}">${x}</button>`).join("")}</div><button class="button button--primary" id="translate-button">Translate</button><div id="translation-content" class="translation-result prose">${state.translation ? markdown(state.translation) : ""}</div></div></div>`;
  root.querySelectorAll(".language-option").forEach(
    (b) =>
      (b.onclick = () => {
        state.selectedLanguage = b.dataset.lang;
        renderTranslation();
      }),
  );
  $("#translate-button").onclick = translate;
}
async function translate() {
  if (!state.currentDocument) return noDoc();
  loading(
    true,
    "Translating your document…",
    `Preparing ${state.selectedLanguage} text.`,
  );
  try {
    const data = await api.translate(state.selectedLanguage);
    state.translation = data.translation || "";
    toast("Translation completed");
    renderTranslation();
  } catch (e) {
    toast(
      e.message === "NETWORK_ERROR"
        ? "StudyLens couldn't connect to the AI engine."
        : "Translation couldn't be completed. Please try again.",
      "error",
    );
  } finally {
    loading(false);
  }
}
async function copyText(text) {
  if (!text) return toast("Nothing to copy", "error");
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied ✓");
  } catch {
    toast("Copy is unavailable in this browser", "error");
  }
}
function openModal(title, body) {
  const m = $("#modal-container");
  m.classList.remove("hidden");
  m.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal__header"><h2 id="modal-title">${escapeHTML(title)}</h2><button class="icon-button" id="modal-close" aria-label="Close">×</button></div><div class="modal__content">${body}</div></div>`;
  $("#modal-close").onclick = closeModal;
  m.onclick = (e) => {
    if (e.target === m) closeModal();
  };
}
function closeModal() {
  $("#modal-container").classList.add("hidden");
  $("#modal-container").innerHTML = "";
}
function bind() {
  $$(
    "#sidebar-nav button,.sidebar__footer button,.feature-card,.workspace-tools-panel button,.tool-tab",
  ).forEach((b) =>
    b.addEventListener("click", () => {
      const v = b.dataset.view;
      if (v) navigate(v);
    }),
  );
  $("#upload-button").onclick = () => $("#pdf-file-input").click();
  $("#upload-zone").onclick = () => $("#pdf-file-input").click();
  $("#upload-zone").onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      $("#pdf-file-input").click();
    }
  };
  $("#pdf-file-input").onchange = (e) => upload(e.target.files[0]);
  ["dragenter", "dragover"].forEach((t) =>
    $("#upload-zone").addEventListener(t, (e) => {
      e.preventDefault();
      $("#upload-zone").classList.add("upload-zone--dragging");
    }),
  );
  ["dragleave", "drop"].forEach((t) =>
    $("#upload-zone").addEventListener(t, (e) => {
      e.preventDefault();
      $("#upload-zone").classList.remove("upload-zone--dragging");
    }),
  );
  $("#upload-zone").ondrop = (e) => upload(e.dataTransfer.files[0]);
  $("#theme-toggle").onclick = setTheme;
  $("#mobile-menu").onclick = () => {
    $("#sidebar").classList.toggle("open");
    $("#mobile-backdrop").classList.toggle("show");
  };
  $("#mobile-backdrop").onclick = () => {
    $("#sidebar").classList.remove("open");
    $("#mobile-backdrop").classList.remove("show");
  };
  $("#demo-button").onclick = () => {
    toast("Demo mode is visual only. Upload a real PDF to use the AI engine.");
    navigate("dashboard");
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      toast("Global search is coming soon");
    }
  });
  $$('[data-upload-trigger="true"]').forEach(
    (b) => (b.onclick = () => $("#pdf-file-input").click()),
  );
}
async function boot() {
  bind();
  renderAsk();
  renderSummary();
  renderNotes();
  renderQuiz();
  renderTranslation();
  try {
    await api.healthCheck();
    $("#health-dot").classList.add("healthy");
    $("#document-status").textContent = "Engine online";
  } catch {
    $("#document-status").textContent = "Engine offline";
    toast("StudyLens engine is offline. Start FastAPI on port 8000.", "error");
  }
}
boot();
