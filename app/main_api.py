from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import os
import shutil

from app.pdf_processor import extract_text_from_pdf
from app.chunker import create_chunks
from app.embeddings import create_embeddings
from app.vector_store import load_vector_store, save_vector_store
from app.retriever import Retriever
from app.reranker import Reranker
from app.rag import generate_answer

app = FastAPI(
    title="AI PDF Tutor",
    description="AI-powered PDF study assistant",
    version="1.0.0"
)

@app.post("/upload")
def upload_pdf(file: UploadFile = File(...)):

    upload_dir = "data/uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(
        upload_dir,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    pages = extract_text_from_pdf(file_path)

    chunks = create_chunks(pages)

    embeddings = create_embeddings(chunks)

    save_vector_store(
        embeddings,
        chunks
    )

    Retriever.chunks = chunks
    Retriever.embeddings = embeddings

    return {
        "message": "PDF uploaded and processed successfully.",
        "filename": file.filename,
        "pages": len(pages),
        "chunks": len(chunks)
    }



# Load RAG components once when the server starts
embeddings, chunks = load_vector_store()

retriever = Retriever(
    chunks,
    embeddings
)

reranker = Reranker()


class QuestionRequest(BaseModel):
    question: str


@app.get("/")
def home():
    return {
        "message": "AI PDF Tutor API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/ask")
def ask_question(request: QuestionRequest):

    results = retriever.retrieve(
        request.question,
        top_k=10,
        similarity_threshold=0.0
    )

    results = reranker.rerank(
        request.question,
        results,
        top_k=3,
        threshold=0.0
    )

    if not results:
        return {
            "answer": "I couldn't find the answer in the provided document.",
            "sources": []
        }

    answer = generate_answer(
        request.question,
        results
    )

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