# StudyLens — Frontend

A premium, vanilla HTML/CSS/JS frontend for the existing FastAPI StudyLens backend. No backend files were touched — this package only adds/replaces the `frontend/` folder.

## 1. Final file structure

```
frontend/
├── index.html
├── css/
│   ├── variables.css      design tokens: color, type, spacing, motion
│   ├── base.css            resets, global element styles, focus states
│   ├── layout.css          app shell, sidebar, topbar, view/grid layout, responsive
│   ├── components.css      buttons, cards, chat, quiz, modal, toast, forms
│   └── animations.css      keyframes, reduced-motion overrides
└── js/
    ├── api.js               centralized API layer (the only file that calls fetch)
    ├── state.js              single app-state object + tiny pub/sub
    ├── markdown.js           dependency-free, sanitizing markdown renderer
    ├── utils.js               shared helpers: skeletons, inline errors, copy, download
    ├── toast.js               toast notification system
    ├── modal.js                modal system (focus trap, Escape to close)
    ├── theme.js                dark/light theme + localStorage persistence
    ├── navigation.js           view routing, sidebar, mobile drawer
    ├── upload.js                drag-and-drop upload, staged processing UI
    ├── chat.js                  Ask AI chat interface + sources panel
    ├── summary.js                Summary view
    ├── notes.js                   Notes view
    ├── quiz.js                     Quiz parsing + interactive quiz UI
    ├── translation.js              language modal + translation view
    └── app.js                       bootstrap: wires every module together
```

Nothing under `app/` (the FastAPI backend) was created, modified, or referenced beyond calling its existing HTTP endpoints.

## 2. How the frontend connects to each backend endpoint

All requests go through `js/api.js`, which centralizes `API_URL = "http://127.0.0.1:8000"` and wraps every call in consistent error handling.

| Endpoint | Called from | UI result |
|---|---|---|
| `GET /health` | `app.js → checkBackendHealth()` on load | Silent on success; toast + console error if the backend is unreachable |
| `POST /upload` | `upload.js → handleFileSelected()` | Staged processing UI (frontend-only steps), then a document card and "Start studying" |
| `POST /ask` | `chat.js → submitQuestion()` | Chat bubble with markdown-rendered answer, source chips, and a synced sources panel |
| `POST /summary` | `summary.js → loadSummary()` | Reading-surface view with reading-time estimate, copy/download/regenerate |
| `POST /notes` | `notes.js → loadNotes()` | Structured markdown notes with copy/download/regenerate |
| `POST /quiz` | `quiz.js → loadQuiz()` | Parsed into an interactive multiple-choice quiz when the text matches the expected shape; otherwise a clean formatted fallback (see below) |
| `POST /translate` | `translation.js → runTranslation()` | Language-picker modal → dedicated Translation view with in-page search |

## 3. Running it

**Backend** (from the project root, unchanged):
```bash
uvicorn app.main_api:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
python -m http.server 5500
```
Then open `http://127.0.0.1:5500`.

No build step, bundler, or package installation is required — it's plain HTML/CSS/JS, exactly as the existing project is set up.

## 4. Assumptions made

- The backend holds one document in memory at a time (per the stated limitation), so the UI is built around a single active document rather than a document library. "My Document" in the sidebar reflects this.
- `/upload`, `/summary`, `/notes`, and `/quiz` are synchronous with no progress events, so the multi-step processing UI (Extracting pages → Creating chunks → …) is a frontend-only presentation, not real backend progress — this is explicitly commented in `upload.js`.
- Quiz text format isn't guaranteed. The parser in `quiz.js` looks for a `Question N` / numbered pattern with lettered options and an optional `Answer: X` line. If parsing fails, or a question has no discoverable answer key, the UI never fabricates a correct answer — it either falls back to a formatted read-only view, or (per-question) skips right/wrong marking with an explicit note.
- Reranker scores are shown only in an optional, secondary context (the source detail modal), not in the primary chat UI, per the "don't expose technical reranker details prominently" instruction.
- Source page previews aren't backed by an endpoint yet, so clicking a source opens a modal that states the page range and says a page-level preview is coming, rather than inventing a PDF viewer.

## 5. Remaining backend limitations (frontend works around these, doesn't fix them)

- No real upload/generation progress — steps shown are illustrative.
- No page-level PDF preview endpoint.
- No multi-document management endpoint (library, recents).
- No flashcards, personalized learning, quiz-history, text-to-speech, or semantic-search endpoints — all represented in the sidebar as disabled "Soon" items with no fake network calls.
- Quiz has no guaranteed structured format or answer key — handled defensively as described above.

## 6. Testing checklist

- [ ] Upload a PDF via click-to-browse and via drag-and-drop
- [ ] Confirm filename / page count / chunk count render after upload
- [ ] Ask a question, confirm markdown rendering, source chips, and the sources panel update
- [ ] Copy and Regenerate buttons on a chat answer
- [ ] Generate Summary, Notes, and Quiz; confirm copy/download/regenerate on Summary & Notes
- [ ] Take the quiz through to the score screen (or the fallback view, if the generated text isn't parseable)
- [ ] Open Translate, pick a language, confirm the Translation view and in-page search
- [ ] Toggle dark/light theme, refresh, confirm it persisted
- [ ] Resize to tablet/mobile widths — sidebar becomes a drawer, source panel stacks, no horizontal scroll
- [ ] Stop the backend and retry an action — confirm a friendly error toast, not a raw error
- [ ] Tab through the app with a keyboard — visible focus states, modal focus trap, Escape closes modals
- [ ] `Cmd/Ctrl+K` opens the action search
