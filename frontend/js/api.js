/* =========================================================
   StudyLens — API layer
   Every backend call lives here. Nothing else in the app
   touches fetch() directly. Endpoint contracts are exactly
   as specified by the existing FastAPI backend — do not
   change paths, methods, or payload shapes here.
   ========================================================= */

const API_URL = "http://127.0.0.1:8000";

/**
 * Thrown for any failure talking to the backend, whether it's
 * a network failure or a non-2xx HTTP response. Callers can
 * rely on `.friendlyMessage` for user-facing copy.
 */
class ApiError extends Error {
  constructor(message, { status = null, friendlyMessage = null, cause = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.friendlyMessage = friendlyMessage || message;
    this.cause = cause;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch (err) {
    console.error(`[api] network error calling ${path}`, err);
    throw new ApiError("Network error", {
      friendlyMessage: "StudyLens couldn't connect to the AI engine. Make sure the backend is running.",
      cause: err,
    });
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.warn(`[api] non-JSON response from ${path}`, text.slice(0, 200));
    }
  }

  if (!response.ok) {
    const detail = (data && (data.detail || data.message)) || null;
    console.error(`[api] ${path} responded ${response.status}`, data);
    throw new ApiError(`Request to ${path} failed with ${response.status}`, {
      status: response.status,
      friendlyMessage: detail || defaultErrorForStatus(response.status),
    });
  }

  return data;
}

function defaultErrorForStatus(status) {
  if (status === 404) return "That resource wasn't found. Try uploading a document first.";
  if (status >= 500) return "The AI engine ran into a problem. Please try again in a moment.";
  return "Something went wrong talking to the AI engine.";
}

const api = {
  async healthCheck() {
    return request("/health");
  },

  async ping() {
    return request("/");
  },

  async uploadPDF(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/upload", { method: "POST", body: formData });
  },

  async askQuestion(question) {
    return request("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
  },

  async generateSummary() {
    return request("/summary", { method: "POST" });
  },

  async generateNotes() {
    return request("/notes", { method: "POST" });
  },

  async generateQuiz() {
    return request("/quiz", { method: "POST" });
  },

  async translate(targetLanguage) {
    return request("/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_language: targetLanguage }),
    });
  },
};

window.api = api;
window.ApiError = ApiError;
