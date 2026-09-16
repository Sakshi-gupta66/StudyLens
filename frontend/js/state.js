/* =========================================================
   StudyLens — App state
   A single, simple state object. Not over-engineered: plain
   object + a tiny pub/sub so views can react to changes
   without polling.
   ========================================================= */

const appState = {
  currentDocument: null, // { filename, pages, chunks, uploadedAt }
  activeView: "dashboard",
  isProcessing: false,
  chatMessages: [], // { role, text, sources, id }
  summary: null,
  notes: null,
  quiz: null, // raw string from backend
  parsedQuiz: null, // parsed question array, or null if unparseable
  translation: null, // { text, language }
  selectedLanguage: null,
  theme: "dark",
  backendOnline: null, // null = unknown, true/false once checked
};

const stateListeners = new Set();

function subscribeState(fn) {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}

function setState(patch) {
  Object.assign(appState, patch);
  stateListeners.forEach((fn) => fn(appState));
}

function hasDocument() {
  return Boolean(appState.currentDocument);
}

window.appState = appState;
window.setState = setState;
window.subscribeState = subscribeState;
window.hasDocument = hasDocument;
