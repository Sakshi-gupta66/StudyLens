from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil

from app.translation_service import translate_text
from app.quiz_service import generate_quiz
from app.notes_service import generate_notes
from app.summary_service import generate_summary
from app.pdf_processor import extract_text_from_pdf
from app.chunker import create_chunks
from app.embeddings import create_embeddings
from app.vector_store import load_vector_store, save_vector_store
from app.retriever import Retriever
from app.reranker import Reranker
from app.rag import generate_answer

class TranslationRequest(BaseModel):
    target_language: str

current_pdf_path = None

app = FastAPI(
    title="AI PDF Tutor",
    description="AI-powered PDF study assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


embeddings, chunks = load_vector_store()

retriever = Retriever(
    chunks,
    embeddings
)

reranker = Reranker()

class QuestionRequest(BaseModel):
    question: str


# Home

@app.get("/")
def home():
    return {
        "message": "AI PDF Tutor API is running"
    }


# Health check

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# Upload PDF

@app.post("/upload")
def upload_pdf(file: UploadFile = File(...)):

    global retriever, current_pdf_path

    print("UPLOAD: request received")

    upload_dir = "data/uploads"

    os.makedirs(
        upload_dir,
        exist_ok=True
    )

    file_path = os.path.join(
        upload_dir,
        file.filename
    )

    print("UPLOAD: saving file")

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    print("UPLOAD: file saved")

    current_pdf_path = file_path

    print("UPLOAD: extracting PDF")

    pages = extract_text_from_pdf(
        file_path
    )

    print(
        f"UPLOAD: extracted {len(pages)} pages"
    )

    print("UPLOAD: creating chunks")

    chunks = create_chunks(
        pages
    )

    print(
        f"UPLOAD: created {len(chunks)} chunks"
    )

    if not chunks:
        return {
            "message": "PDF uploaded, but no text could be extracted.",
            "filename": file.filename,
            "pages": len(pages),
            "chunks": 0
        }

    print("UPLOAD: creating embeddings")

    embeddings = create_embeddings(
        chunks
    )

    print("UPLOAD: embeddings created")

    print("UPLOAD: saving vector store")

    save_vector_store(
        embeddings,
        chunks
    )

    print("UPLOAD: vector store saved")

    retriever = Retriever(
        chunks,
        embeddings
    )

    print("UPLOAD: retriever ready")

    return {
        "message": "PDF uploaded and processed successfully.",
        "filename": file.filename,
        "pages": len(pages),
        "chunks": len(chunks)
    }


# Ask question

@app.post("/ask")
def ask_question(
    request: QuestionRequest
):

    results = retriever.retrieve(
        request.question,
        top_k=10,
        similarity_threshold=0.0
    )

    # Rerank candidates
    results = reranker.rerank(
        request.question,
        results,
        top_k=3,
        threshold=0.0
    )

    # No relevant information
    if not results:

        return {
            "answer": (
                "I couldn't find the answer "
                "in the provided document."
            ),
            "sources": []
        }

    # Generate answer
    answer = generate_answer(
        request.question,
        results
    )

    # Prepare sources
    sources = []

    for result in results:

        chunk = result["chunk"]

        sources.append({
            "pages": chunk["page_numbers"],
            "rerank_score": result["rerank_score"]
        })

    return {
        "answer": answer,
        "sources": sources
    }


# Generate summary
@app.post("/summary")
def summary():

    if not current_pdf_path:
        return {
            "message": "Please upload a PDF first."
        }

    pages = extract_text_from_pdf(
        current_pdf_path
    )

    result = generate_summary(pages)

    return {
        "summary": result
    }

# Generate notes

@app.post("/notes")
def notes():

    if not current_pdf_path:
        return {
            "message": "Please upload a PDF first."
        }

    pages = extract_text_from_pdf(
        current_pdf_path
    )

    result = generate_notes(pages)

    return {
        "notes": result
    }

# Generate quiz

@app.post("/quiz")
def quiz():

    if not current_pdf_path:
        return {
            "message": "Please upload a PDF first."
        }

    pages = extract_text_from_pdf(
        current_pdf_path
    )

    result = generate_quiz(pages)

    return {
        "quiz": result
    }


# Translate text

@app.post("/translate")
def translate(request: TranslationRequest):

    if not current_pdf_path:
        return {
            "message": "Please upload a PDF first."
        }

    pages = extract_text_from_pdf(
        current_pdf_path
    )

    result = translate_text(
        pages,
        request.target_language
    )

    return {
        "translation": result,
        "target_language": request.target_language
    }