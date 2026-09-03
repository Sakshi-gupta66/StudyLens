from utils.pdf_processor import extract_text_from_pdf

from features.summarizer import generate_summary
from features.notes_generator import generate_notes
from features.quiz_generator import generate_quiz
from features.translator import translate_text
from langchain_core.prompts import PromptTemplate


PDF_PATH = "sample.pdf"



def get_pdf_text(pdf_path):
    """
    Extract and combine text from the PDF.
    """

    pages = extract_text_from_pdf(pdf_path)

    if not pages:
        return None

    return "\n\n".join(
        f"--- Page {page['page_number']} ---\n{page['text']}"
        for page in pages
    )


def main():

    # -----------------------------
    # Extract PDF
    # -----------------------------

    pdf_text = get_pdf_text(PDF_PATH)

    if not pdf_text:
        print("Could not extract text from PDF.")
        return

    print("PDF processed successfully.")
    print()
    


    # -----------------------------
    # Generate Summary
    # -----------------------------

    summary = generate_summary(pdf_text)

    if summary:
        print("\n========== SUMMARY ==========\n")
        print(summary)


if __name__ == "__main__":
    main()