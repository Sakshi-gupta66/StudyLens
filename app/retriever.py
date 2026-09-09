from sentence_transformers import SentenceTransformer
from vector_store import search


class Retriever:

    def __init__(self, chunks, embeddings):
        self.chunks = chunks
        self.embeddings = embeddings
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def retrieve(self, query, top_k=3):
        query_embedding = self.model.encode(query)

        results = search(
            query_embedding,
            self.embeddings,
            self.chunks,
            top_k=top_k
        )

        return results