def create_chunks(pages, chunk_size=1000, overlap_paragraphs=1):
    chunks = []

    current_paragraphs = []
    current_pages = []
    current_length = 0

    for page in pages:

        page_number = page["page_number"]

        paragraphs = page["text"].split("\n\n")

        for paragraph in paragraphs:

            paragraph = paragraph.strip()

            if not paragraph:
                continue

            paragraph_length = len(paragraph)

            if (
                current_paragraphs
                and current_length + paragraph_length > chunk_size
            ):
                chunks.append({
                    "text": "\n\n".join(current_paragraphs),
                    "page_numbers": current_pages
                })

                current_paragraphs = current_paragraphs[
                    -overlap_paragraphs:
                ]

                current_pages = current_pages[
                    -overlap_paragraphs:
                ]

                current_length = sum(
                    len(p) for p in current_paragraphs
                )

            current_paragraphs.append(paragraph)

            if page_number not in current_pages:
                current_pages.append(page_number)

            current_length += paragraph_length

    if current_paragraphs:
        chunks.append({
            "text": "\n\n".join(current_paragraphs),
            "page_numbers": current_pages
        })

    return chunks