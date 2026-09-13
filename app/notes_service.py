from app.llm_service import ask_llm


def generate_notes(pages):

    print("NOTES: function started")
    print("NOTES: pages received =", len(pages))

    document_text = ""

    for page in pages[:3]:
        document_text += f"\nPage {page['page_number']}:\n"
        document_text += page["text"]

    print("NOTES: text prepared")
    print("NOTES: text length =", len(document_text))

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
- Return only the notes.

Study material:
{document_text}

Notes:
"""

    print("NOTES: sending request to LLM")

    result = ask_llm(prompt)

    print("NOTES: LLM responded")

    return result