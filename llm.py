import os

from dotenv import load_dotenv
from openai import OpenAI
from langchain_core.prompts import PromptTemplate
from llm import generate_response


prompt_template = PromptTemplate.from_template(
    """
    You are an AI tutor.

    Explain this topic in simple language:

    {topic}
    """
)


prompt = prompt_template.format(
    topic="Gradient Descent"
)


answer = generate_response(prompt)

print(answer)

# Load variables from .env
load_dotenv()


# Get API key
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError(
        "OPENAI_API_KEY is not configured."
    )


# Get model name
model = os.getenv("OPENAI_MODEL")

if not model:
    raise ValueError(
        "OPENAI_MODEL is not configured."
    )


# Create OpenAI client
client = OpenAI(api_key=api_key)


def generate_response(prompt):
    """
    Send a prompt to the LLM
    and return the generated text.
    """

    try:
        response = client.responses.create(
            model=model,
            input=prompt
        )

        return response.output_text

    except Exception as e:
        print(f"LLM request failed: {e}")
        return None