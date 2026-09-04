from llm_service import ask_llm


def generate_quiz(pages):
    document_text = ""

    for page in pages:
        document_text += f"\nPage {page['page_number']}:\n"
        document_text += page["text"]

    prompt = f"""
You are a helpful study assistant.

Create a quiz based ONLY on the following study material.

Generate 5 multiple-choice questions.

For each question:
- Provide 4 options: A, B, C, D.
- Provide the correct answer.
- Provide a short explanation.
- Test understanding rather than simple memorization when possible.
- Do not use information that is not present in the study material.

Format the output clearly.

Study material:
{document_text}
"""

    return ask_llm(prompt)