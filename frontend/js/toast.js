/* =========================================================
   StudyLens — Toasts
   ========================================================= */

const TOAST_ICONS = {
  success: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  error: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M10 6v5M10 13.5v.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  warning: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 3l8.5 14.5H1.5L10 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 8v4M10 14.5v.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M10 9v5M10 6v.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

function toast(message, type = "info", { duration = 4200 } = {}) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.setAttribute("role", "status");
  el.innerHTML = `
    <span class="toast__icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
    <span class="toast__message"></span>
    <button class="toast__close" aria-label="Dismiss notification">
      <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  `;
  el.querySelector(".toast__message").textContent = message;

  const remove = () => {
    el.classList.add("is-leaving");
    setTimeout(() => el.remove(), 220);
  };

  el.querySelector(".toast__close").addEventListener("click", remove);
  container.appendChild(el);

  if (duration) {
    setTimeout(remove, duration);
  }

  return { remove };
}

window.toast = toast;
