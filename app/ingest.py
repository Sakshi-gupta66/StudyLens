from app.pdf_processor import extract_text_from_pdf
from app.chunker import create_chunks
from app.embeddings import create_embeddings
from app.vector_store import save_vector_store


PDF_PATH = "data/uploads/sample.pdf"


def ingest_document():
    pages = extract_text_from_pdf(PDF_PATH)

    chunks = create_chunks(pages)

    embeddings = create_embeddings(chunks)

    save_vector_store(
        embeddings,
        chunks
    )

    print("Document ingestion complete.")
    print(f"Pages: {len(pages)}")
    print(f"Chunks: {len(chunks)}")


if __name__ == "__main__":
    ingest_document()