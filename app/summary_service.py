from app.llm_service import ask_llm


def generate_summary(pages):

    print("SUMMARY: function started")
    print("SUMMARY: pages received =", len(pages))

    document_text = ""

    for page in pages[:3]:
        document_text += f"\nPage {page['page_number']}:\n"
        document_text += page["text"]

    print("SUMMARY: text prepared")
    print("SUMMARY: text length =", len(document_text))

    prompt = f"""
You are a study assistant.

Create a concise summary of the following study material.

IMPORTANT:
- Use only the provided material.
- Do not add outside information.
- Return only the summary.

Study material:
{document_text}

Summary:
"""

    print("SUMMARY: sending request to LLM")

    result = ask_llm(prompt)

    print("SUMMARY: LLM responded")

    return result