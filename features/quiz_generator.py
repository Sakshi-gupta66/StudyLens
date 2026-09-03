from llm import generate_response


def generate_quiz(content, number_of_questions=5):
    """
    Generate multiple-choice questions
    from document content.
    """

    prompt = f"""
You are an AI tutor.

Create {number_of_questions} multiple-choice
questions based only on the following content.

For each question provide:

1. Question
2. Four options
3. Correct answer
4. Short explanation

Requirements:
- Questions should test understanding.
- Do not invent information.
- Use only the provided content.

Content:

{content}
"""

    return generate_response(prompt)