from app.llm_service import ask_llm


def translate_text(pages, target_language):

    translated_pages = []

    for page in pages[:3]:

        print(
            f"TRANSLATE: processing page {page['page_number']}"
        )

        page_text = page["text"].strip()

        if not page_text:
            continue

        prompt = f"""
You are a professional translation engine.

Translate the following text into {target_language}.

IMPORTANT:
- Translate the text itself.
- Return ONLY the translated text.
- Do not summarize.
- Do not add information.
- Preserve formulas, numbers, symbols and technical terms.

Original text:

{page_text}

Translation:
"""

        translated_text = ask_llm(prompt)

        print(
            f"TRANSLATE: page {page['page_number']} completed"
        )

        translated_pages.append(
            f"Page {page['page_number']}:\n{translated_text}"
        )

    return "\n\n".join(translated_pages)