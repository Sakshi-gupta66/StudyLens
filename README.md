# StudyLens

StudyLens is a web application that lets you upload a PDF and interact with its content using AI.

Instead of going through a long document manually, you can upload it and ask questions about its content. The application processes the document, retrieves relevant information, and uses an LLM to generate an answer.

The project is being developed as a practical implementation of **Retrieval-Augmented Generation (RAG)**, while also focusing on making it useful as a learning tool.

## Features

### Currently Available

* 📄 PDF upload and processing
* 🔎 Ask questions about uploaded PDFs
* 🤖 RAG-based question answering
* 🧠 Context-aware answers using document content
* ⚡ FastAPI backend
* 🌐 Web-based frontend
* 📑 PDF text extraction using PyMuPDF
* 🔗 Interactive API documentation with Swagger UI

### Planned / Improving

The core application is working, and we are currently improving it and adding more learning-focused features.

* 📖 Ask questions about specific pages
* 🗂️ Flashcard generation
* 🎯 Personalized learning
* 📊 Quiz performance tracking
* 🔊 Text-to-speech
* 🔍 Semantic search
* 📑 Page-wise explanations
* 📚 Multiple PDF support

---

## How It Works

The application follows a basic RAG pipeline:

```text
                    PDF
                     │
                     ▼
              Text Extraction
                     │
                     ▼
                Chunking
                     │
                     ▼
                Embeddings
                     │
                     ▼
               Vector Store
                     │
                     │
User Question ───────┘
       │
       ▼
 Query Embedding
       │
       ▼
 Retrieve Relevant Chunks
       │
       ▼
 Relevant Context + Question
       │
       ▼
              LLM
       │
       ▼
     Final Answer
```

### 1. Upload the PDF

The user uploads a PDF through the frontend.

The backend receives the file and starts processing it.

### 2. Extract the Text

The application uses **PyMuPDF** to extract text from the PDF.

This converts the document into text that can be processed by the RAG pipeline.

### 3. Split the Document

Large documents are divided into smaller sections called **chunks**.

For example:

```text
PDF
 ├── Chunk 1
 ├── Chunk 2
 ├── Chunk 3
 ├── Chunk 4
 └── ...
```

Each chunk can then be processed and searched independently.

### 4. Generate Embeddings

The chunks are converted into embeddings.

An embedding represents the meaning of a piece of text as a vector.

This allows the application to compare the user's question with the document content based on semantic similarity.

### 5. Retrieve Relevant Content

When the user asks a question, the question is converted into an embedding as well.

The system searches the document's stored vectors and retrieves the most relevant chunks.

For example:

```text
Question:
"What is the main objective of this paper?"

              ↓

        Semantic Search

              ↓

Relevant document chunks
```

### 6. Generate the Answer

The retrieved chunks are passed to the LLM along with the user's question.

The LLM uses the retrieved context to generate the final response.

This complete process is known as **Retrieval-Augmented Generation (RAG)**.

---

## Why RAG?

A PDF can contain hundreds of pages, and sending the entire document to an LLM for every question is not an efficient approach.

RAG works differently.

Instead of giving the LLM the whole document, the application first searches for the relevant parts of the document and then provides those parts as context.

```text
Traditional approach

Entire PDF → LLM → Answer


RAG approach

PDF → Index
          ↓
Question → Search → Relevant Content → LLM → Answer
```

This makes the system more suitable for working with larger documents.

---

## Tech Stack

### Backend

* Python
* FastAPI
* Uvicorn

### Frontend

* HTML
* CSS
* JavaScript

### PDF Processing

* PyMuPDF

### AI / LLM

* LLM API
* Embedding model

### RAG

* LangChain
* Vector store

### Development

* Git
* GitHub
* VS Code

---

## Project Structure

```text
StudyLens/
│
├── backend/
│   ├── main.py
│   ├── ...
│
├── frontend/
│   ├── index.html
│   ├── ...
│
├── data/
│   └── uploads/
│
├── .env
├── .gitignore
├── requirements.txt
└── README.md
```

The structure may change as new features are added.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/StudyLens.git
```

```bash
cd StudyLens
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

On Windows:

```bash
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file and add the required API key:

```env
OPENAI_API_KEY=your_api_key_here
```

Do not commit your `.env` file to GitHub.

Make sure it is included in `.gitignore`.

---

## Running the Project

Start the FastAPI backend:

```bash
uvicorn backend.main:app --reload
```

The backend will run locally at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

Open the frontend in your browser to use the application.

---

## Example

Suppose a student uploads a 50-page research paper.

Instead of manually searching through the paper, they can ask:

```text
"What methodology was used in this research?"
```

The system searches the document, finds the relevant sections, and sends those sections to the LLM.

The final response is generated using the retrieved information.

```text
50-page PDF
     ↓
Extract text
     ↓
Create chunks
     ↓
Create embeddings
     ↓
Store vectors
     ↓
User asks a question
     ↓
Retrieve relevant chunks
     ↓
Send context to LLM
     ↓
Generate answer
```

---

## Learning Features

The long-term goal of StudyLens is to go beyond simple PDF question answering and become a more complete **AI-powered study assistant**.

### 📖 Page-specific Questions

Users will be able to ask questions about a particular page instead of searching the entire document.

### 🗂️ Flashcard Generation

The application will generate flashcards from important concepts in the uploaded PDF.

```text
Concept → Question
Concept → Answer
```

This can help with revision.

### 🎯 Personalized Learning

The system will use the user's interactions and performance to provide more relevant learning material.

### 📊 Quiz Performance Tracking

Users will be able to take quizzes generated from their documents and track their performance over time.

### 🔊 Text-to-Speech

Answers and explanations can be converted into speech so users can listen instead of reading everything.

### 🔍 Semantic Search

Users will be able to search the document based on meaning rather than only matching exact keywords.

### 📑 Page-wise Explanations

The application will provide explanations for individual pages or sections of a PDF.

### 📚 Multiple PDF Support

Users will eventually be able to upload multiple PDFs and ask questions across all of them.

---

## Current Status

**Backend:** ✅ Completed

**Frontend:** ✅ Completed

**Basic RAG pipeline:** ✅ Working

**PDF processing:** ✅ Working

**Question answering:** ✅ Working

**Further improvements:** 🚧 In progress

The core application is complete and usable. Development is now focused on improving the existing system and adding the learning features listed above.

---

## Future Direction

The project is gradually moving from a simple **"chat with your PDF"** application toward an **AI-powered learning assistant**.

The planned workflow is:

```text
                 PDF
                  │
                  ▼
          Document Processing
                  │
                  ▼
             RAG System
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   Questions   Summary    Search
       │
       ├── Flashcards
       ├── Quizzes
       ├── Explanations
       └── Personalized Learning
                  │
                  ▼
           Learning Progress
```

---

## What I Learned

This project helped me work with:

* PDF processing
* Text extraction
* Text chunking
* Embeddings
* Vector search
* Retrieval-Augmented Generation
* LLM APIs
* LangChain
* FastAPI
* REST APIs
* Frontend-backend integration
* Git and GitHub

More importantly, the project helped me understand how the different components of a real-world AI application fit together.

---

## License

This project is currently intended for learning and educational purposes.
