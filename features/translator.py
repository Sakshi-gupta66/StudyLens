from llm import generate_response


def translate_text(content, target_language):
    """
    Translate document content into the
    requested language.
    """

    prompt = f"""
You are an AI educational translator.

Translate the following content into
{target_language}.

Requirements:
- Preserve the original meaning.
- Preserve important technical terms.
- Keep the content easy to understand.
- Do not add new information.

Content:

{content}
"""

    return generate_response(prompt)