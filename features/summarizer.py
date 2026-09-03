from llm import generate_response


def generate_summary(content):
    """
    Generate a summary from document content.
    """

    prompt = f"""
You are an AI tutor.

Summarize the following educational content.

Requirements:
- Use simple language.
- Focus on important concepts.
- Use clear headings and bullet points.
- Do not invent information.
- Base the summary only on the provided content.

Content:

{content}
"""

    return generate_response(prompt)