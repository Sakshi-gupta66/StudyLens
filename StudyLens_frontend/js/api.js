const API_URL = "http://127.0.0.1:8000";
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch (error) {
    console.error(error);
    throw new Error("NETWORK_ERROR");
  }
  let data = null;
  try {
    data = await response.json();
  } catch {}
  if (!response.ok) {
    console.error("API error", response.status, data);
    throw new Error(data?.detail || data?.message || `HTTP_${response.status}`);
  }
  return data;
}
export const api = {
  healthCheck: () => request("/health"),
  root: () => request("/"),
  uploadPDF: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/upload", { method: "POST", body: form });
  },
  askQuestion: (question) =>
    request("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }),
  generateSummary: () => request("/summary", { method: "POST" }),
  generateNotes: () => request("/notes", { method: "POST" }),
  generateQuiz: () => request("/quiz", { method: "POST" }),
  translate: (language) =>
    request("/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_language: language }),
    }),
};
export { API_URL };
