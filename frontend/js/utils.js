/* =========================================================
   StudyLens — Shared utilities
   ========================================================= */

function renderSkeleton(lines = 6) {
  return `
    <div class="skeleton-block" aria-hidden="true">
      ${Array.from({ length: lines })
        .map(() => `<div class="skeleton skeleton-line"></div>`)
        .join("")}
    </div>
  `;
}

function renderInlineError(message, retryExpr) {
  return `
    <div class="empty-state">
      <div class="empty-state__icon" style="background: var(--danger-soft); color: var(--danger);">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5v5.5M12 16v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <h3>Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn--secondary" onclick="${retryExpr}">Try again</button>
    </div>
  `;
}

function copyPlainText(text, btnEl) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const original = btnEl.textContent;
      btnEl.textContent = "Copied ✓";
      btnEl.classList.add("copy-flash");
      toast("Copied to clipboard", "success", { duration: 2000 });
      setTimeout(() => {
        btnEl.textContent = original;
        btnEl.classList.remove("copy-flash");
      }, 1500);
    })
    .catch(() => toast("Couldn't copy to clipboard", "error"));
}

function downloadAsFile(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("Download started", "success", { duration: 2000 });
}

window.renderSkeleton = renderSkeleton;
window.renderInlineError = renderInlineError;
window.copyPlainText = copyPlainText;
window.downloadAsFile = downloadAsFile;
