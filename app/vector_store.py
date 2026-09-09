import json
import numpy as np


def cosine_similarity(query_vector, document_vectors):
    query_norm = np.linalg.norm(query_vector)
    document_norms = np.linalg.norm(document_vectors, axis=1)

    similarities = np.dot(document_vectors, query_vector) / (
        document_norms * query_norm
    )

    return similarities


def search(
    query_vector,
    embeddings,
    chunks,
    top_k=3,
    similarity_threshold=0.0
):
    similarities = cosine_similarity(
        query_vector,
        embeddings
    )

    top_indices = np.argsort(similarities)[::-1]

    results = []

    for index in top_indices:
        score = float(similarities[index])

        if score < similarity_threshold:
            break

        results.append({
            "chunk": chunks[index],
            "score": score
        })

        if len(results) == top_k:
            break

    return results


def save_vector_store(embeddings, chunks):
    np.save(
        "data/embeddings.npy",
        embeddings
    )

    with open(
        "data/chunks.json",
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            chunks,
            file,
            ensure_ascii=False,
            indent=2
        )


def load_vector_store():
    embeddings = np.load(
        "data/embeddings.npy"
    )

    with open(
        "data/chunks.json",
        "r",
        encoding="utf-8"
    ) as file:
        chunks = json.load(file)

    return embeddings, chunks