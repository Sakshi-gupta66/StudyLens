from vector_store import load_vector_store
from retriever import Retriever
from rag import generate_answer
from reranker import Reranker


reranker = Reranker()

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
        top_k=10,
        similarity_threshold=0.0
    )

    reranker = Reranker()

    results = reranker.rerank(
        question,
        results,
        top_k=3,
        threshold=0.0
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

    print("\n===== RETRIEVED CHUNKS =====")

    for result in results:

        chunk = result["chunk"]

        print(f"\nPage: {chunk['page_numbers']}")
        print(f"Final score: {result['score']:.4f}")
        print(f"Semantic score: {result['semantic_score']:.4f}")
        print(f"Keyword score: {result['keyword_score']:.4f}")
        print(f"Rerank score: {result['rerank_score']:.4f}")
        print("Text:")
        print(chunk["text"])


if __name__ == "__main__":
    main()