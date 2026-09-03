import fitz
import re


def clean_text(text):
    """
    Clean unnecessary spaces and excessive blank lines.
    """

    # Replace multiple spaces/tabs with a single space
    text = re.sub(r"[ \t]+", " ", text)

    # Replace 3 or more newlines with 2 newlines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def extract_text_from_pdf(pdf_path):
    """
    Extract text from every page of a PDF.

    Returns:
        A list of dictionaries containing:
        - page_number
        - text
    """

    pages = []

    try:
        with fitz.open(pdf_path) as document:

            # Check for password-protected PDF
            if document.is_encrypted:
                raise ValueError("PDF is password protected.")

            # Process every page
            for page_number, page in enumerate(document, start=1):

                # Extract text
                text = page.get_text("text")

                # Clean text
                text = clean_text(text)

                # Ignore pages with no extractable text
                if not text:
                    continue

                pages.append({
                    "page_number": page_number,
                    "text": text
                })

        return pages

    except Exception as e:
        print(f"PDF processing failed: {e}")
        return []