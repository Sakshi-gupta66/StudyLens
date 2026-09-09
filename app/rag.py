from llm_service import ask_llm


def generate_answer(question, retrieved_results):
    context = ""

    for result in retrieved_results:
        chunk = result["chunk"]

        context += (
            f"\nPage {chunk['page_number']}:\n"
            f"{chunk['text']}\n"
        )

    prompt = f"""
You are a helpful study assistant.

Answer the user's question using ONLY the provided context.

If the answer cannot be found in the context, say:
"I couldn't find the answer in the provided document."

Do not make up information.

Context:
{context}

Question:
{question}

Answer:
"""

    return ask_llm(prompt)