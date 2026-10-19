// Connects to the existing StudyLens FastAPI routes.
const API_URL = "http://127.0.0.1:8000";
const $ = (s) => document.querySelector(s);
const state = { document: null, chat: [], tab: "chat", result: "" };
function notify(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => t.classList.remove("show"), 4000);
}
function status(label, ready = false) {
  $("#status").textContent = "● " + label;
  $("#status").classList.toggle("ready", ready);
}
async function api(path, options = {}) {
  let r;
  try {
    r = await fetch(API_URL + path, options);
  } catch (e) {
    throw Error(
      "Cannot reach API at " + API_URL + ". Is FastAPI running? " + e.message,
    );
  }
  let d;
  try {
    d = await r.json();
  } catch {
    d = {};
  }
  if (!r.ok) throw Error(d.detail || d.message || "HTTP " + r.status);
  return d;
}
async function health() {
  try {
    await api("/health");
    $("#upload-msg").textContent = "API connected. Upload a PDF to begin.";
  } catch (e) {
    status("Offline");
    $("#upload-msg").textContent = e.message;
    console.error(e);
  }
}
async function upload(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".pdf"))
    return notify("Please choose a PDF file.");
  if (file.size > 100 * 1024 * 1024)
    return notify("PDF must be 100 MB or smaller.");
  if (!file.size) return notify("This file is empty.");
  status("Processing");
  $("#drop-title").textContent = "Processing your PDF…";
  $("#upload-msg").textContent =
    "Uploading, extracting text and building the search index…";
  const f = new FormData();
  f.append("file", file);
  try {
    const d = await api("/upload", { method: "POST", body: f });
    state.document = {
      filename: d.filename || file.name,
      pages: d.pages ?? "—",
      chunks: d.chunks ?? "—",
    };
    $("#docname").textContent = state.document.filename;
    $("#doctitle").textContent = state.document.filename;
    $("#docsub").textContent = d.message || "Your PDF is ready to study.";
    $("#pages").textContent = state.document.pages;
    $("#chunks").textContent = state.document.chunks;
    $("#drop-title").textContent = "Document ready";
    $("#upload-msg").textContent =
      "Upload successful. Ask a question or choose a document tool.";
    $("#drop").querySelector(".cloud").textContent = "✓";
    status("Ready", true);
    state.chat = [];
    renderChat();
    notify("PDF uploaded successfully");
  } catch (e) {
    $("#drop-title").textContent = "Upload failed";
    $("#upload-msg").textContent = e.message;
    status("Upload failed");
    console.error("Upload failed:", e);
    notify(e.message);
  }
}
function renderChat() {
  const b = $("#chatbody");
  b.innerHTML = "";
  if (state.tab === "sources") {
    const src = state.chat.flatMap((m) => m.sources || []);
    if (!src.length) {
      b.innerHTML =
        '<div class="empty"><div class="emptyicon">▧</div><h3>Sources will appear here</h3><p>Ask a question to see source page references.</p></div>';
      return;
    }
    src.forEach((s) => {
      const d = document.createElement("div");
      d.className = "bubble assistant";
      d.textContent =
        "Page(s): " +
        (Array.isArray(s.pages) ? s.pages.join(", ") : (s.pages ?? "—"));
      b.append(d);
    });
    return;
  }
  if (!state.chat.length) {
    b.innerHTML =
      '<div class="empty"><div class="emptyicon">▤</div><h3>Ask anything about your document</h3><p>Get answers grounded in your PDF, with page references.</p></div>';
    return;
  }
  state.chat.forEach((m) => {
    const d = document.createElement("div");
    d.className = "bubble " + m.role;
    d.textContent = m.text;
    if (m.sources?.length) {
      const s = document.createElement("small");
      s.textContent =
        "Sources: " +
        m.sources
          .map(
            (x) =>
              "page " +
              (Array.isArray(x.pages) ? x.pages.join(", ") : (x.pages ?? "—")),
          )
          .join("; ");
      d.append(s);
    }
    b.append(d);
  });
  b.scrollTop = b.scrollHeight;
}
async function ask() {
  const q = $("#question").value.trim();
  if (!q) return;
  if (!state.document) return notify("Upload a PDF first.");
  $("#question").value = "";
  state.chat.push({ role: "user", text: q });
  renderChat();
  $("#ask").disabled = true;
  try {
    const d = await api("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    state.chat.push({
      role: "assistant",
      text: d.answer || "No answer returned.",
      sources: d.sources || [],
    });
  } catch (e) {
    state.chat.push({
      role: "assistant",
      text: "Couldn't get an answer: " + e.message,
    });
    console.error(e);
  } finally {
    $("#ask").disabled = false;
    renderChat();
  }
}
function showResult(title, value) {
  state.result =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  $("#resulttitle").textContent = title;
  $("#resultbody").textContent = state.result;
  $("#result").hidden = false;
  $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
}
async function tool(name) {
  if (!state.document) return notify("Upload a PDF first.");
  const cfg = {
    summary: ["/summary", "Summary", "summary"],
    notes: ["/notes", "Study notes", "notes"],
    quiz: ["/quiz", "Practice quiz", "quiz"],
    translate: ["/translate", "Translation", "translation"],
  }[name];
  if (!cfg) return;
  const buttons = [
    ...document.querySelectorAll('[data-action="' + name + '"]'),
  ];
  buttons.forEach((b) => (b.disabled = true));
  try {
    const opts = { method: "POST" };
    if (name === "translate") {
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify({ target_language: $("#language").value });
    }
    const d = await api(cfg[0], opts);
    showResult(cfg[1], d[cfg[2]] ?? d.message ?? d);
    notify(cfg[1] + " ready");
  } catch (e) {
    showResult(cfg[1] + " · Error", e.message);
    notify(e.message);
    console.error(e);
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}
function resetUpload() {
  $("#drop-title").textContent = "Drop your PDF here";
  $("#drop").querySelector("p").innerHTML =
    'or <button id="browse" class="link">click to browse</button>';
  $("#drop").querySelector(".cloud").textContent = "⇧";
  $("#drop").querySelector("small").textContent =
    "PDF files only · up to 100 MB";
  $("#upload-msg").textContent = "";
  $("#browse").addEventListener("click", (e) => {
    e.stopPropagation();
    $("#pdf").click();
  });
}

const input = document.getElementById("pdf-file-input");
const chooseButton = document.getElementById("upload-button");
const drop = document.getElementById("upload-zone");

console.log("StudyLens upload elements:", {
  input,
  chooseButton,
  drop
});

if (!input || !chooseButton || !drop) {
  console.error(
    "Upload setup failed: check the IDs in index.html."
  );
} else {
  chooseButton.addEventListener("click", (event) => {
    event.preventDefault();
    input.click();
  });

  input.addEventListener("change", async () => {
    const file = input.files?.[0];

    console.log("Selected file:", file?.name);

    if (file) {
      await upload(file);
    }

    input.value = "";
  });

  drop.addEventListener("dragover", (event) => {
    event.preventDefault();
    drop.classList.add("drag");
  });

  drop.addEventListener("dragleave", () => {
    drop.classList.remove("drag");
  });

  drop.addEventListener("drop", async (event) => {
    event.preventDefault();
    drop.classList.remove("drag");

    const file = event.dataTransfer.files?.[0];

    if (file) {
      await upload(file);
    }
  });
}

$("#choose").onclick = (e) => {
  e.stopPropagation();
  input.click();
};
$("#browse").onclick = (e) => {
  e.stopPropagation();
  input.click();
};
drop.onclick = (e) => {
  if (!e.target.closest("button")) input.click();
};
drop.onkeydown = (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    input.click();
  }
};
input.onchange = () => {
  console.log("File input changed:", input.files);

  const file = input.files?.[0];

  if (file) {
    console.log("Selected file:", file.name, file.size);
    upload(file);
  } else {
    console.warn("No file selected.");
  }

  input.value = "";
};
drop.ondragover = (e) => {
  e.preventDefault();
  drop.classList.add("drag");
};
drop.ondragleave = () => drop.classList.remove("drag");
drop.ondrop = (e) => {
  e.preventDefault();
  drop.classList.remove("drag");
  upload(e.dataTransfer.files[0]);
};
$("#ask").onclick = ask;
$("#question").onkeydown = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    ask();
  }
};
document.querySelectorAll(".suggestions button").forEach(
  (b) =>
    (b.onclick = () => {
      $("#question").value = b.textContent;
      $("#question").focus();
    }),
);
document
  .querySelectorAll("[data-action]")
  .forEach((b) => (b.onclick = () => tool(b.dataset.action)));
document
  .querySelectorAll("[data-scroll]")
  .forEach(
    (b) =>
      (b.onclick = () =>
        document
          .getElementById(b.dataset.scroll === "top" ? "top" : b.dataset.scroll)
          .scrollIntoView({ behavior: "smooth" })),
  );
document.querySelectorAll(".tab").forEach(
  (b) =>
    (b.onclick = () => {
      state.tab = b.dataset.tab;
      document
        .querySelectorAll(".tab")
        .forEach((x) => x.classList.toggle("active", x === b));
      renderChat();
    }),
);
$("#theme").onclick = () => document.body.classList.toggle("dark");
$("#copy").onclick = async () => {
  try {
    await navigator.clipboard.writeText(state.result);
    notify("Copied result");
  } catch {
    notify("Clipboard unavailable");
  }
};
health();
