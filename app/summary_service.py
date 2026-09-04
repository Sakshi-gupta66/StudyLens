from llm_service import ask_llm


def generate_summary(pages):
    document_text = ""

    for page in pages:
        document_text += f"\nPage {page['page_number']}:\n"
        document_text += page["text"]

    prompt = f"""
You are a helpful study assistant.

Summarize the following study material clearly and concisely.

Study material:
{document_text}
"""

    return ask_llm(prompt)