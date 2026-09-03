from llm import generate_response


def generate_notes(content):
    """
    Generate structured study notes
    from document content.
    """

    prompt = f"""
You are an AI tutor.

Convert the following educational content
into well-structured study notes.

Include:
- Main concepts
- Important definitions
- Key points
- Important examples when available

Use clear headings and bullet points.

Do not add information that is not supported
by the provided content.

Content:

{content}
"""

    return generate_response(prompt)