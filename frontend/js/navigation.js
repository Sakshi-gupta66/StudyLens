/* =========================================================
   StudyLens — Navigation
   View switching, sidebar behavior, mobile drawer.
   ========================================================= */

const VIEWS_REQUIRING_DOCUMENT = ["workspace", "ask", "summary", "notes", "quiz", "translation"];

function goToView(viewName) {
  const target = document.getElementById(`${viewName}-view`);
  if (!target) {
    console.warn(`[navigation] unknown view: ${viewName}`);
    return;
  }

  if (VIEWS_REQUIRING_DOCUMENT.includes(viewName) && !hasDocument()) {
    toast("Upload a PDF before starting a study session.", "warning");
    viewName = "dashboard";
  }

  document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-active"));
  document.getElementById(`${viewName}-view`).classList.add("is-active");

  document.querySelectorAll(".sidebar__nav-item").forEach((item) => {
    item.classList.toggle("sidebar__nav-item--active", item.dataset.view === viewName);
  });

  setState({ activeView: viewName });
  closeMobileSidebar();
  document.getElementById("app-main").scrollTo({ top: 0, behavior: "smooth" });
  window.location.hash = viewName;

  if (viewName === "summary") ensureSummaryLoaded();
  if (viewName === "notes") ensureNotesLoaded();
  if (viewName === "quiz") ensureQuizLoaded();
  if (viewName === "translation") renderTranslationResult();
  if (viewName === "workspace") renderWorkspaceOverview();
}

function initNavigation() {
  document.querySelectorAll(".sidebar__nav-item[data-view]").forEach((item) => {
    item.addEventListener("click", () => {
      if (item.hasAttribute("data-soon")) {
        toast(`${item.dataset.featureName || "This feature"} is coming soon.`, "info");
        return;
      }
      goToView(item.dataset.view);
    });
  });

  const initial = (window.location.hash || "#dashboard").replace("#", "");
  goToView(document.getElementById(`${initial}-view`) ? initial : "dashboard");

  document.getElementById("sidebar-collapse-btn")?.addEventListener("click", () => {
    document.getElementById("app-shell").classList.toggle("sidebar-collapsed");
  });

  document.getElementById("topbar-menu-btn")?.addEventListener("click", () => {
    document.getElementById("app-shell").classList.add("sidebar-open");
  });
}

function closeMobileSidebar() {
  document.getElementById("app-shell")?.classList.remove("sidebar-open");
}

document.addEventListener("click", (e) => {
  const shell = document.getElementById("app-shell");
  if (!shell || !shell.classList.contains("sidebar-open")) return;
  if (shell.classList.contains("sidebar-open") && !document.getElementById("sidebar").contains(e.target) && !e.target.closest("#topbar-menu-btn")) {
    closeMobileSidebar();
  }
});

window.goToView = goToView;
window.initNavigation = initNavigation;
