/* =========================================================
   StudyLens — Theme
   ========================================================= */

const THEME_KEY = "studylens:theme";

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = stored || (prefersLight ? "light" : "dark");
  applyTheme(theme, { persist: false });
}

function applyTheme(theme, { persist = true } = {}) {
  document.documentElement.setAttribute("data-theme", theme);
  setState({ theme });
  if (persist) localStorage.setItem(THEME_KEY, theme);
  updateThemeToggleIcon(theme);
}

function toggleTheme() {
  const next = appState.theme === "dark" ? "light" : "dark";
  applyTheme(next);
}

function updateThemeToggleIcon(theme) {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.innerHTML =
    theme === "dark"
      ? '<svg viewBox="0 0 20 20" fill="none"><path d="M17 10.8A7 7 0 019.2 3a7 7 0 108.8 7.8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1L4.7 4.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  btn.setAttribute("data-tooltip", theme === "dark" ? "Light mode" : "Dark mode");
}

window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
