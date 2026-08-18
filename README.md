
# StudyLens- AI PDF Learning Assistant


StudyLens is an AI-powered learning assistant that helps students understand and revise content from PDF documents. Instead of reading an entire PDF manually, users can upload a document and use AI to generate useful learning material from it.


## Features

📄 1. Text Summarization

Upload a PDF and generate a concise summary of its content.

Summarize the entire PDF
Generate concise and easy-to-understand explanations
Reduce lengthy content into important information

📝 2. Notes Generation
Convert PDF content into structured study notes.

Important points
Key concepts
Definitions
Bullet-point notes
Easy-to-revise format

🧠 3. Quiz Generation
Generate quizzes automatically from the PDF content.

Multiple-choice questions
Questions based on important concepts
Answers and explanations
Useful for self-assessment and exam preparation

🌐 4. Translation
Translate PDF content into another language.

Translate selected text
Support multiple languages
Make study material easier to understand


## Project Objective

The main objective of StudyLens is to make learning from PDF documents faster, easier, and more interactive using Generative AI.

Instead of simply reading a PDF, students can transform the same content into:

PDF → Summary → Notes → Quiz → Revision
## How It Works

```text
                ┌──────────────┐
                │  Upload PDF  │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │ Extract Text │
                └──────┬───────┘
                       ↓
              ┌─────────────────┐
              │  AI Processing  │
              └───────┬─────────┘
                      ↓
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
    Summary         Notes          Quiz
        │             │             │
        └─────────────┼─────────────┘
                      ↓
                Translation
```


## 📂 Project Structure

```text
StudyLens/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── styles/
│   └── app.js
│
├── backend/
│   ├── main.py
│   ├── routes/
│   ├── services/
│   ├── models/
│   └── utils/
│
├── ai/
│   ├── summarizer.py
│   ├── notes_generator.py
│   ├── quiz_generator.py
│   └── translator.py
│
├── data/
│
├── tests/
│
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```



## 🎓 Why StudyLens?

Traditional PDF reading is mostly passive. StudyLens aims to turn a PDF into an **interactive learning resource**.

For example:

```text
100-page textbook
       ↓
   StudyLens
       ↓
 ┌───────────────┐
 │ Summary       │
 │ Study Notes   │
 │ Quiz          │
 │ Translation   │
 └───────────────┘
```

This can help students **understand → revise → test → improve**.

---

## 🧪 Current Status

🚧 **MVP in Development**

Currently focusing on:

* [ ] PDF upload
* [ ] PDF text extraction
* [ ] Text summarization
* [ ] Notes generation
* [ ] Quiz generation
* [ ] Translation
* [ ] Basic frontend
* [ ] Backend API integration


## Tech Stack

**Frontend:** HTML,
CSS,
JavaScript,
React

**Backend:** Python,
FastAPI

**Database:** PostgreSQL

**AI / NLP:**
Large Language Model (LLM),
Hugging Face Transformers,
Prompt Engineering

**Development Tools:**
Git,
GitHub,
VS Code
## Current Status

🚧 MVP in Development

Currently focusing on:

PDF upload

PDF text extraction

Text summarization

Notes generation

Quiz generation

Translation

Basic frontend

Backend API integration
## Future Scope

The initial version focuses on four core features. More learning-focused features can be added later:

💬 Chat with PDF

📖 Ask questions about specific pages

🗂️ Flashcard generation

🎯 Personalized learning

📊 Quiz performance tracking

🔊 Text-to-speech

🔍 Semantic search

📑 Page-wise explanations

📚 Multiple PDF support

🤖 RAG-based question answering