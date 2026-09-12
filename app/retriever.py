from sentence_transformers import SentenceTransformer
from app.vector_store import search


class Retriever:

    def __init__(self, chunks, embeddings):
        self.chunks = chunks
        self.embeddings = embeddings
        self.model = SentenceTransformer(
            "all-MiniLM-L6-v2"
        )

    def retrieve(
        self,
        query,
        top_k=3,
        similarity_threshold=0.0
    ):
        query_embedding = self.model.encode(query)

        results = search(
            query,
            query_embedding,
            self.embeddings,
            self.chunks,
            top_k=top_k,
            similarity_threshold=similarity_threshold
        )

        return results