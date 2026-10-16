from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from fastapi import HTTPException
import uuid

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
    title="StudyLens",
    description="AI-powered document study assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
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
        "message": "StudyLens API is running"
    }


# Health check

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# Upload PDF


MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global retriever, current_pdf_path

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    content = await file.read(MAX_UPLOAD_BYTES + 1)

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="PDF exceeds the 100 MB upload limit."
        )

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF."
        )

    upload_dir = "data/uploads"
    os.makedirs(upload_dir, exist_ok=True)

    # Use a generated filename to avoid path traversal
    # and accidental overwriting of another uploaded file.
    file_path = os.path.join(
        upload_dir,
        f"{uuid.uuid4().hex}.pdf"
    )

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        pages = extract_text_from_pdf(file_path)

        if not pages or not any(
            page["text"].strip() for page in pages
        ):
            raise HTTPException(
                status_code=422,
                detail=(
                    "No extractable text was found in this PDF. "
                    "Scanned PDFs may require OCR."
                )
            )

        chunks = create_chunks(pages)

        if not chunks:
            raise HTTPException(
                status_code=422,
                detail="Unable to create searchable PDF chunks."
            )

        new_embeddings = create_embeddings(chunks)

        # Prepare the new retriever before changing active state.
        new_retriever = Retriever(chunks, new_embeddings)

        save_vector_store(new_embeddings, chunks)

        current_pdf_path = file_path
        retriever = new_retriever

        return {
            "message": "PDF uploaded and processed successfully.",
            "filename": os.path.basename(file.filename),
            "pages": len(pages),
            "chunks": len(chunks)
        }

    except HTTPException:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    except Exception as exc:
        if os.path.exists(file_path):
            os.remove(file_path)

        print(f"PDF processing failed: {exc}")

        raise HTTPException(
            status_code=422,
            detail="The PDF could not be processed."
        ) from exc

    finally:
        await file.close()


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