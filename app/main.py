from pdf_processor import extract_text_from_pdf
from summary_service import generate_summary
from notes_service import generate_notes
from quiz_service import generate_quiz
from translation_service import translate_text
from chunker import create_chunks


PDF_PATH = "data/uploads/sample.pdf"


def main():
    pages = extract_text_from_pdf(PDF_PATH)

    # summary = generate_summary(pages)

    # print("\n===== SUMMARY =====\n")
    # print(summary)

    # notes = generate_notes(pages)

    # print("\n===== NOTES =====\n")
    # print(notes)

    # quiz = generate_quiz(pages)

    # print("\n===== QUIZ =====\n")
    # print(quiz)

    # translated_text = translate_text(pages, "Hindi")

    # print("\n===== TRANSLATION =====\n")
    # print(translated_text)

    pages = extract_text_from_pdf(PDF_PATH)

    chunks = create_chunks(pages)

    print(f"Number of pages: {len(pages)}")
    print(f"Number of chunks: {len(chunks)}")

    for i, chunk in enumerate(chunks[:5]):
        print(f"\n===== Chunk {i + 1} =====")
        print(f"Page: {chunk['page_number']}")
        print(chunk["text"])


if __name__ == "__main__":
    main()