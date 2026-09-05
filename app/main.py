from pdf_processor import extract_text_from_pdf
from summary_service import generate_summary
from notes_service import generate_notes
from quiz_service import generate_quiz
from translation_service import translate_text
from chunker import create_chunks
from embeddings import create_embeddings
from sentence_transformers import SentenceTransformer
from vector_store import search



PDF_PATH = "data/uploads/sample.pdf"


def main():
    pages = extract_text_from_pdf(PDF_PATH)

    # summary = generate_summary(pages)
    # notes = generate_notes(pages)
    # quiz = generate_quiz(pages)
    # translated_text = translate_text(pages, "Hindi")

    pages = extract_text_from_pdf(PDF_PATH)

    chunks = create_chunks(pages)

    embeddings = create_embeddings(chunks)

    model = SentenceTransformer("all-MiniLM-L6-v2")

    query = "What is this document about?"

    query_embedding = model.encode(query)

    results = search(
        query_embedding,
        embeddings,
        chunks,
        top_k=3
    )

    print("\n===== RETRIEVED CHUNKS =====")

    for result in results:
        print(f"\nScore: {result['score']:.4f}")
        print(f"Page: {result['chunk']['page_number']}")
        print(result["chunk"]["text"])


if __name__ == "__main__":
    main()