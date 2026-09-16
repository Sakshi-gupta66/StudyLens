/* =========================================================
   StudyLens — Quiz
   The backend returns generated quiz text, not structured
   JSON. We try to parse it into an interactive format; if the
   text doesn't match an expected shape we fall back to a
   clean, formatted read-only view. We never invent answers
   the backend didn't provide.
   ========================================================= */

let quizCurrentIndex = 0;
let quizAnswers = {}; // index -> selected option letter

function initQuiz() {
  document.getElementById("generate-quiz-btn")?.addEventListener("click", () => loadQuiz(Boolean(appState.quiz)));
}

async function ensureQuizLoaded() {
  if (appState.quiz) {
    renderQuizView();
    return;
  }
  await loadQuiz(false);
}

async function loadQuiz(isRegenerate) {
  const container = document.getElementById("quiz-container");
  if (!hasDocument()) {
    toast("Upload a PDF before starting a study session.", "warning");
    return;
  }
  container.innerHTML = renderSkeleton(10);

  try {
    const result = await api.generateQuiz();
    const raw = result.quiz || "";
    const parsed = parseQuizText(raw);
    quizCurrentIndex = 0;
    quizAnswers = {};
    setState({ quiz: raw, parsedQuiz: parsed });
    renderQuizView();
    toast(isRegenerate ? "Quiz regenerated" : "Quiz ready", "success");
  } catch (err) {
    const msg = err instanceof ApiError ? err.friendlyMessage : "We couldn't build a quiz. Please try again.";
    container.innerHTML = renderInlineError(msg, "loadQuiz(false)");
    toast(msg, "error");
  }
}

/**
 * Parses text like:
 *   Question 1: What is soft computing?
 *   A. ...
 *   B. ...
 *   C. ...
 *   D. ...
 *   Answer: B
 * Returns an array of { question, options: [{letter, text}], correctLetter | null }
 * or null if the text doesn't look like a parseable quiz.
 */
function parseQuizText(raw) {
  if (!raw || typeof raw !== "string") return null;

  const normalized = raw.replace(/\r\n/g, "\n");
  const blocks = normalized
    .split(/\n(?=\s*(?:Q(?:uestion)?\.?\s*\d+|[0-9]+[\.\)])\s*[:.\)]?\s*)/i)
    .map((b) => b.trim())
    .filter(Boolean);

  const questions = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const qMatch = lines[0].match(/^(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\)])\s*[:.\)]?\s*(.*)$/i);
    if (!qMatch) continue;

    let questionText = qMatch[1];
    const options = [];
    let correctLetter = null;
    let cursor = 1;

    // question text might wrap to the next line before options start
    while (cursor < lines.length && !/^[A-Da-d][\.\)]\s+/.test(lines[cursor])) {
      if (/^(answer|correct)/i.test(lines[cursor])) break;
      questionText += ` ${lines[cursor]}`;
      cursor += 1;
    }

    for (; cursor < lines.length; cursor += 1) {
      const optMatch = lines[cursor].match(/^([A-Da-d])[\.\)]\s+(.*)$/);
      if (optMatch) {
        let text = optMatch[2];
        const inlineCorrect = text.match(/\s*[\(\[]?\s*(?:correct|✓)\s*[\)\]]?\s*$/i);
        if (inlineCorrect) {
          correctLetter = optMatch[1].toUpperCase();
          text = text.slice(0, inlineCorrect.index).trim();
        }
        options.push({ letter: optMatch[1].toUpperCase(), text });
        continue;
      }
      const ansMatch = lines[cursor].match(/^(?:answer|correct\s*answer)\s*[:\-]?\s*([A-Da-d])\b/i);
      if (ansMatch) {
        correctLetter = ansMatch[1].toUpperCase();
      }
    }

    if (options.length >= 2) {
      questions.push({ question: questionText.trim(), options, correctLetter });
    }
  }

  return questions.length >= 1 ? questions : null;
}

function renderQuizView() {
  const container = document.getElementById("quiz-container");
  const questions = appState.parsedQuiz;

  if (!questions) {
    renderQuizFallback(container);
    return;
  }

  renderQuizQuestion(container, questions);
}

function renderQuizFallback(container) {
  container.innerHTML = `
    <p style="color: var(--text-secondary); font-size: var(--fs-sm); margin-bottom: var(--space-4);">
      We couldn't turn this into an interactive quiz, so here's the generated version.
    </p>
    <div class="quiz__raw-fallback">${renderMarkdown(appState.quiz)}</div>
    <div class="content-actions">
      <button class="btn btn--secondary btn--sm" id="copy-quiz-btn">Copy</button>
      <button class="btn btn--ghost btn--sm" id="regenerate-quiz-btn">Regenerate</button>
    </div>
  `;
  document.getElementById("copy-quiz-btn").addEventListener("click", (e) => copyPlainText(appState.quiz, e.currentTarget));
  document.getElementById("regenerate-quiz-btn").addEventListener("click", () => loadQuiz(true));
}

function renderQuizQuestion(container, questions) {
  if (quizCurrentIndex >= questions.length) {
    renderQuizScore(container, questions);
    return;
  }

  const q = questions[quizCurrentIndex];
  const selected = quizAnswers[quizCurrentIndex];
  const answered = selected !== undefined;
  const hasKey = Boolean(q.correctLetter);

  container.innerHTML = `
    <div class="quiz">
      <div class="quiz__topbar">
        <span>Question ${quizCurrentIndex + 1} of ${questions.length}</span>
        <span>${Object.keys(quizAnswers).length} answered</span>
      </div>
      <div class="quiz__progress-track" id="quiz-progress">
        <div class="quiz__progress-fill" style="width: ${(quizCurrentIndex / questions.length) * 100}%"></div>
      </div>
      <div class="quiz__card">
        <div class="quiz__question" id="quiz-question">${escapeHtml(q.question)}</div>
        <div class="quiz__options" id="quiz-options">
          ${q.options
            .map((opt) => {
              let cls = "quiz__option";
              if (answered) {
                if (hasKey && opt.letter === q.correctLetter) cls += " quiz__option--correct";
                else if (opt.letter === selected && (!hasKey || opt.letter !== q.correctLetter)) cls += " quiz__option--incorrect";
              } else if (opt.letter === selected) {
                cls += " quiz__option--selected";
              }
              return `
                <button class="${cls}" data-letter="${opt.letter}" ${answered ? "disabled" : ""}>
                  <span class="quiz__option-letter">${opt.letter}</span>
                  <span>${escapeHtml(opt.text)}</span>
                </button>`;
            })
            .join("")}
        </div>
        ${!hasKey && answered ? `<p style="margin-top: var(--space-4); font-size: var(--fs-xs); color: var(--text-tertiary);">This question didn't include an answer key, so we're not marking it right or wrong.</p>` : ""}
      </div>
      <div class="quiz__footer">
        <button class="btn btn--ghost btn--sm" id="quiz-previous" ${quizCurrentIndex === 0 ? "disabled" : ""}>Previous</button>
        <button class="btn btn--primary btn--sm" id="quiz-next" ${answered ? "" : "disabled"}>
          ${quizCurrentIndex === questions.length - 1 ? "See results" : "Next question"}
        </button>
      </div>
    </div>
  `;

  container.querySelectorAll(".quiz__option").forEach((btn) => {
    btn.addEventListener("click", () => {
      quizAnswers[quizCurrentIndex] = btn.dataset.letter;
      renderQuizQuestion(container, questions);
    });
  });

  document.getElementById("quiz-previous").addEventListener("click", () => {
    quizCurrentIndex = Math.max(0, quizCurrentIndex - 1);
    renderQuizQuestion(container, questions);
  });

  document.getElementById("quiz-next").addEventListener("click", () => {
    quizCurrentIndex += 1;
    renderQuizQuestion(container, questions);
  });
}

function renderQuizScore(container, questions) {
  const scored = questions.filter((q) => q.correctLetter);
  const correctCount = scored.filter((q, i) => quizAnswers[questions.indexOf(q)] === q.correctLetter).length;
  const pct = scored.length ? Math.round((correctCount / scored.length) * 100) : null;

  container.innerHTML = `
    <div class="quiz__card quiz__score-screen">
      ${
        pct !== null
          ? `<div class="quiz__score-ring" style="--pct:${pct}">
              <span class="quiz__score-value" id="quiz-score">${pct}%</span>
            </div>
            <h3 style="font-family: var(--font-display); font-size: var(--fs-lg); margin-bottom: var(--space-2);">
              ${correctCount} of ${scored.length} correct
            </h3>
            <p style="color: var(--text-secondary); font-size: var(--fs-sm); max-width: 36ch; margin: 0 auto;">
              Nice work. Review any questions you missed, or generate a new set to keep practicing.
            </p>`
          : `<h3 style="font-family: var(--font-display); font-size: var(--fs-lg); margin-bottom: var(--space-2);">Quiz complete</h3>
            <p style="color: var(--text-secondary); font-size: var(--fs-sm); max-width: 36ch; margin: 0 auto;">
              This quiz didn't include an answer key, so we can't calculate a score — but you've been through every question.
            </p>`
      }
      <div style="display:flex; gap: var(--space-3); justify-content:center; margin-top: var(--space-6);">
        <button class="btn btn--secondary" id="quiz-review-btn">Review answers</button>
        <button class="btn btn--primary" id="quiz-retake-btn">New quiz</button>
      </div>
    </div>
  `;

  document.getElementById("quiz-review-btn").addEventListener("click", () => {
    quizCurrentIndex = 0;
    renderQuizQuestion(container, questions);
  });
  document.getElementById("quiz-retake-btn").addEventListener("click", () => loadQuiz(true));
}

window.initQuiz = initQuiz;
window.ensureQuizLoaded = ensureQuizLoaded;
window.loadQuiz = loadQuiz;
