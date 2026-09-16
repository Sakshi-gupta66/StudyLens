/* =========================================================
   StudyLens — Modal
   Renders arbitrary modal content into #modal-container.
   ========================================================= */

let lastFocusedEl = null;

function openModal(innerHtml, { wide = false, onClose = null, id = null } = {}) {
  const container = document.getElementById("modal-container");
  if (!container) return;

  lastFocusedEl = document.activeElement;
  container.innerHTML = `
    <div class="modal__scrim" data-modal-dismiss></div>
    <div class="modal ${wide ? "modal--wide" : ""}" ${id ? `id="${id}"` : ""} role="dialog" aria-modal="true">
      ${innerHtml}
    </div>
  `;
  container.classList.add("is-open");
  container._onClose = onClose;

  container.querySelectorAll("[data-modal-dismiss]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  const closeBtn = container.querySelector(".modal__close");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  const focusable = container.querySelector("input, button, [tabindex]");
  if (focusable) focusable.focus();

  document.addEventListener("keydown", handleModalKeydown);
}

function closeModal() {
  const container = document.getElementById("modal-container");
  if (!container || !container.classList.contains("is-open")) return;

  container.classList.remove("is-open");
  const onClose = container._onClose;
  container.innerHTML = "";
  document.removeEventListener("keydown", handleModalKeydown);

  if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
    lastFocusedEl.focus();
  }
  if (typeof onClose === "function") onClose();
}

function handleModalKeydown(e) {
  if (e.key === "Escape") {
    closeModal();
  }
  if (e.key === "Tab") {
    const container = document.getElementById("modal-container");
    const focusables = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

window.openModal = openModal;
window.closeModal = closeModal;
