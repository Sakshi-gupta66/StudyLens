export const $ = (s) => document.querySelector(s);
export const $$ = (s) => [...document.querySelectorAll(s)];
export function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.textContent = message;
  $("#toast-container").append(el);
  setTimeout(() => el.remove(), 3600);
}
export function loading(
  show,
  title = "Working…",
  copy = "Preparing your study experience.",
) {
  const overlay = $("#loading-overlay");
  overlay.classList.toggle("hidden", !show);
  $("#loading-title").textContent = title;
  $("#loading-copy").textContent = copy;
}
export function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}
export function markdown(text = "") {
  let s = escapeHTML(text);
  s = s.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  s = s
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>");
  s = s
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(
    /(?:^|\n)([-•] .+(?:\n[-•] .+)*)/g,
    (m) =>
      "<ul>" +
      m
        .trim()
        .split("\n")
        .map((x) => `<li>${x.replace(/^[-•] /, "")}</li>`)
        .join("") +
      "</ul>",
  );
  s = s
    .split(/\n\n+/)
    .map((p) =>
      /^<(h|ul|pre)/.test(p.trim()) ? p : `<p>${p.replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  return s;
}
export function button(label, fn, cls = "button button--ghost") {
  const b = document.createElement("button");
  b.className = cls;
  b.textContent = label;
  b.addEventListener("click", fn);
  return b;
}
