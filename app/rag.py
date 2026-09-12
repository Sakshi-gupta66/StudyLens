from app.llm_service import ask_llm


def generate_answer(question, retrieved_results):

    context = ""

    for i, result in enumerate(retrieved_results):

        chunk = result["chunk"]

        pages = ", ".join(
            str(page)
            for page in chunk["page_numbers"]
        )

        context += (
            f"\n[Source {i + 1} | Pages {pages}]\n"
            f"{chunk['text']}\n"
        )

    prompt = f"""
You are a helpful study assistant.

Answer the user's question using ONLY the provided context.

Rules:
- Do not use outside knowledge.
- Do not make up information.
- If the answer cannot be found in the context, say:
  "I couldn't find the answer in the provided document."
- Cite the source after important statements.
- Use citations exactly like [Source 1], [Source 2], etc.
- Only cite sources that are actually provided in the context.

Context:
{context}

Question:
{question}

Answer:
"""

    return ask_llm(prompt)