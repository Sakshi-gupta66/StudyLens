from llm_service import ask_llm


def generate_notes(pages):
    document_text = ""

    for page in pages:
        document_text += f"\nPage {page['page_number']}:\n"
        document_text += page["text"]

    prompt = f"""
You are a helpful study assistant.

Create clear and well-structured study notes from the following
study material.

Requirements:
- Use headings and subheadings.
- Use bullet points where appropriate.
- Highlight important concepts.
- Keep the notes concise but informative.
- Include important formulas or definitions if present.
- Do not add information that is not present in the study material.

Study material:
{document_text}
"""

    return ask_llm(prompt)