from llm_service import ask_llm


def translate_text(pages, target_language):
    document_text = ""

    for page in pages:
        document_text += f"\nPage {page['page_number']}:\n"
        document_text += page["text"]

    prompt = f"""
You are a translation assistant.

Translate the following study material into {target_language}.

Requirements:
- Preserve the original meaning.
- Keep technical terms accurate.
- Preserve important formulas and symbols.
- Keep the page structure.
- Do not add new information.

Study material:
{document_text}
"""

    return ask_llm(prompt)