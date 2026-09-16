/* =========================================================
   StudyLens — Upload
   The backend upload call is synchronous and returns no
   progress events, so the staged steps below are a frontend
   presentation only — not real backend progress.
   ========================================================= */

const PROCESSING_STEPS = [
  "Uploading PDF",
  "Extracting pages",
  "Creating chunks",
  "Generating embeddings",
  "Building knowledge index",
];

let processingTimer = null;

function initUpload() {
  const zone = document.getElementById("upload-zone");
  const input = document.getElementById("pdf-file-input");
  if (!zone || !input) return;

  zone.addEventListener("click", (e) => {
    if (zone.classList.contains("upload-zone--processing")) return;
    if (e.target.closest("button")) return;
    input.click();
  });

  zone.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && !zone.classList.contains("upload-zone--processing")) {
      e.preventDefault();
      input.click();
    }
  });

  ["dragenter", "dragover"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      if (!zone.classList.contains("upload-zone--processing")) {
        zone.classList.add("upload-zone--dragging");
      }
    })
  );

  ["dragleave", "drop"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove("upload-zone--dragging");
    })
  );

  zone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  });

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) handleFileSelected(file);
    input.value = "";
  });
}

function validateFile(file) {
  const isPdfExt = /\.pdf$/i.test(file.name);
  const isPdfMime = file.type === "application/pdf" || file.type === "";
  if (!isPdfExt || !isPdfMime) {
    return "Only PDF files are supported.";
  }
  const maxBytes = 100 * 1024 * 1024;
  if (file.size > maxBytes) {
    return "This file is larger than 100MB. Try a smaller PDF.";
  }
  return null;
}

async function handleFileSelected(file) {
  const error = validateFile(file);
  if (error) {
    toast(error, "error");
    renderUploadError(error);
    return;
  }

  setState({ isProcessing: true });
  renderUploadProcessing(file);

  try {
    const result = await api.uploadPDF(file);
    stopProcessingAnimation();
    setState({
      isProcessing: false,
      currentDocument: {
        filename: result.filename || file.name,
        pages: result.pages ?? "—",
        chunks: result.chunks ?? "—",
        uploadedAt: Date.now(),
      },
      backendOnline: true,
      chatMessages: [],
      summary: null,
      notes: null,
      quiz: null,
      parsedQuiz: null,
      translation: null,
    });
    renderUploadSuccess();
    updateTopbarDocument();
    toast("PDF uploaded successfully", "success");
  } catch (err) {
    stopProcessingAnimation();
    setState({ isProcessing: false });
    const message =
      err instanceof ApiError
        ? "We couldn't process this PDF. Please try again."
        : "We couldn't process this PDF. Please try again.";
    renderUploadError(message);
    toast(message, "error");
    console.error(err);
  }
}

function renderUploadProcessing(file) {
  const zone = document.getElementById("upload-zone");
  zone.className = "upload-zone--processing";
  zone.id = "upload-zone";

  const stepsHtml = PROCESSING_STEPS.map(
    (label, i) => `
      <div class="process-step" data-step="${i}">
        <span class="process-step__dot">
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.2 3.2L13 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <span>${label}</span>
      </div>`
  ).join("");

  zone.innerHTML = `
    <div class="upload-zone__icon"><span class="spinner" style="width:22px;height:22px;border-width:2.5px;"></span></div>
    <h3>Processing ${escapeHtml(file.name)}</h3>
    <p>This can take a little while for longer documents — sit tight.</p>
    <div class="process-steps" id="process-steps">${stepsHtml}</div>
    <div class="progress-track"><div class="progress-track__fill"></div></div>
  `;

  animateProcessingSteps();
}

function animateProcessingSteps() {
  const steps = () => document.querySelectorAll("#process-steps .process-step");
  let index = 0;
  const advance = () => {
    const items = steps();
    if (!items.length) return;
    items.forEach((el, i) => {
      el.classList.toggle("process-step--done", i < index);
      el.classList.toggle("process-step--active", i === index);
    });
    if (index < PROCESSING_STEPS.length - 1) {
      index += 1;
    }
  };
  advance();
  processingTimer = setInterval(advance, 1100);
}

function stopProcessingAnimation() {
  if (processingTimer) {
    clearInterval(processingTimer);
    processingTimer = null;
  }
  document.querySelectorAll("#process-steps .process-step").forEach((el) => {
    el.classList.add("process-step--done");
    el.classList.remove("process-step--active");
  });
}

function renderUploadSuccess() {
  const zone = document.getElementById("upload-zone");
  const doc = appState.currentDocument;
  zone.className = "upload-zone--success";

  zone.innerHTML = `
    <div class="upload-zone__icon anim-pop" style="background: var(--success-soft); color: var(--success);">
      <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <h3>Document ready</h3>
    <p>Your PDF has been processed and indexed for study.</p>
    <div id="document-card" style="margin-top: var(--space-6); text-align:left;"></div>
    <button class="btn btn--primary btn--block" id="start-studying-btn" style="margin-top: var(--space-5);">
      Start studying
    </button>
  `;

  document.getElementById("document-card").appendChild(buildDocumentCard(doc));
  document.getElementById("start-studying-btn").addEventListener("click", () => goToView("workspace"));
}

function buildDocumentCard(doc) {
  const wrap = document.createElement("div");
  wrap.id = "document-card";
  wrap.className = "document-card";
  wrap.innerHTML = `
    <div class="document-card__icon">
      <svg viewBox="0 0 24 24" fill="none"><path d="M6 3h9l4 4v14H6V3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M15 3v4h4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
    </div>
    <div class="document-card__body">
      <div class="document-card__name">${escapeHtml(doc.filename)}</div>
      <div class="document-card__meta">
        <span>${doc.pages} pages</span>
        <span>${doc.chunks} chunks</span>
      </div>
    </div>
  `;
  return wrap;
}

function renderUploadError(message) {
  const zone = document.getElementById("upload-zone");
  zone.className = "upload-zone--error";
  zone.innerHTML = `
    <div class="upload-zone__icon" style="background: var(--danger-soft); color: var(--danger);">
      <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5v5.5M12 16v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
    <h3>Upload failed</h3>
    <p>${escapeHtml(message)}</p>
    <button class="btn btn--secondary" id="retry-upload-btn" style="margin-top: var(--space-5);">Try again</button>
  `;
  document.getElementById("retry-upload-btn").addEventListener("click", resetUploadZone);
}

function resetUploadZone() {
  const zone = document.getElementById("upload-zone");
  zone.className = "";
  zone.id = "upload-zone";
  zone.setAttribute("tabindex", "0");
  zone.setAttribute("role", "button");
  zone.setAttribute("aria-label", "Upload a PDF file");
  zone.innerHTML = `
    <div class="upload-zone__icon">
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 4v11m0-11l-4 4m4-4l4 4M5 17.5v1A2.5 2.5 0 007.5 21h9a2.5 2.5 0 002.5-2.5v-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <h3>Drop your PDF here</h3>
    <p>or click to browse</p>
    <p class="upload-zone__hint">PDF files only · up to 100MB</p>
  `;
}

function updateTopbarDocument() {
  const nameEl = document.getElementById("current-document");
  const statusEl = document.getElementById("document-status");
  const doc = appState.currentDocument;

  if (!doc) {
    nameEl.textContent = "No document";
    statusEl.dataset.state = "empty";
    statusEl.querySelector(".status-label").textContent = "Waiting";
    return;
  }

  nameEl.textContent = doc.filename;
  nameEl.setAttribute("title", doc.filename);
  statusEl.dataset.state = appState.isProcessing ? "processing" : "ready";
  statusEl.querySelector(".status-label").textContent = appState.isProcessing ? "Processing" : "Ready";
}

window.initUpload = initUpload;
window.updateTopbarDocument = updateTopbarDocument;
window.buildDocumentCard = buildDocumentCard;
