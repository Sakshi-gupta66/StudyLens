import numpy as np


def cosine_similarity(query_vector, document_vectors):
    query_norm = np.linalg.norm(query_vector)
    document_norms = np.linalg.norm(document_vectors, axis=1)

    similarities = np.dot(document_vectors, query_vector) / (
        document_norms * query_norm
    )

    return similarities


def search(query_vector, embeddings, chunks, top_k=3):
    similarities = cosine_similarity(query_vector, embeddings)

    top_indices = np.argsort(similarities)[::-1][:top_k]

    results = []

    for index in top_indices:
        results.append({
            "chunk": chunks[index],
            "score": float(similarities[index])
        })

    return results