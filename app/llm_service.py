from dotenv import load_dotenv
from openai import OpenAI
import os

load_dotenv()


def ask_llm(prompt):
    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        return (
            "The AI service is not configured. "
            "Set OPENROUTER_API_KEY in your environment or .env file."
        )

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key
    )

    try:
        response = client.chat.completions.create(
            model="openrouter/free",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
    except Exception as exc:
        return (
            "The AI service failed to respond. "
            f"Details: {exc}"
        )

    return response.choices[0].message.content


if __name__ == "__main__":
    answer = ask_llm(
        "Explain what a Brain-Computer-Interface is in two sentences."
    )

    print(answer)