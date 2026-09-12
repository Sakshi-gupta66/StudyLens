import json
import numpy as np
import re


STOP_WORDS = {
    "the",
    "is",
    "are",
    "a",
    "an",
    "and",
    "or",
    "of",
    "in",
    "on",
    "to",
    "for",
    "what",
    "which",
    "who",
    "how",
    "why",
    "when",
    "where",
    "used",
    "use",
    "using",
    "name"
}


def tokenize(text):
    words = re.findall(r"\b[a-zA-Z0-9]+\b", text.lower())

    return [
        word
        for word in words
        if word not in STOP_WORDS
    ]


def cosine_similarity(query_vector, document_vectors):
    query_norm = np.linalg.norm(query_vector)
    document_norms = np.linalg.norm(document_vectors, axis=1)

    similarities = np.dot(document_vectors, query_vector) / (
        document_norms * query_norm
    )

    return similarities


def keyword_score(query, text):
    query_words = set(tokenize(query))
    text_words = set(tokenize(text))

    if not query_words:
        return 0.0

    matches = query_words.intersection(text_words)

    return len(matches) / len(query_words)


def search(
    query,
    query_vector,
    embeddings,
    chunks,
    top_k=3,
    similarity_threshold=0.2
):
    similarities = cosine_similarity(
        query_vector,
        embeddings
    )

    results = []

    for index, semantic_score in enumerate(similarities):

        text = chunks[index]["text"]

        keyword = keyword_score(
            query,
            text
        )

        final_score = (
            0.7 * float(semantic_score)
            + 0.3 * keyword
        )

        results.append({
            "chunk": chunks[index],
            "score": final_score,
            "semantic_score": float(semantic_score),
            "keyword_score": keyword
        })

    results.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    filtered_results = []

    for result in results:

        if result["score"] < similarity_threshold:
            continue

        filtered_results.append(result)

        if len(filtered_results) == top_k:
            break

    return filtered_results

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