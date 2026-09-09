from vector_store import load_vector_store
from retriever import Retriever
from rag import generate_answer


def main():
    embeddings, chunks = load_vector_store()

    retriever = Retriever(
        chunks,
        embeddings
    )

    question = input(
        "\nAsk a question about the PDF: "
    )

    results = retriever.retrieve(
        question,
        top_k=3,
        similarity_threshold=0.4
    )

    if not results:
        print(
            "\nI couldn't find relevant information "
            "in the document."
        )
        return

    answer = generate_answer(
        question,
        results
    )

    print("\n===== ANSWER =====\n")
    print(answer)

    print("\n===== SOURCES =====")

    for result in results:
        page_number = result["chunk"]["page_number"]
        score = result["score"]

        print(
            f"Page {page_number} "
            f"(similarity: {score:.4f})"
        )


if __name__ == "__main__":
    main()