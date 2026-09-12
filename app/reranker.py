from sentence_transformers import CrossEncoder


class Reranker:

    def __init__(self):
        self.model = CrossEncoder(
            "cross-encoder/ms-marco-MiniLM-L-6-v2"
        )

    def rerank(self, query, results, top_k=3, threshold=0.0):

        if not results:
            return []

        pairs = []

        for result in results:
            pairs.append([
                query,
                result["chunk"]["text"]
            ])

        scores = self.model.predict(pairs)

        reranked_results = []

        for result, score in zip(results, scores):

            result["rerank_score"] = float(score)

            if score >= threshold:
                reranked_results.append(result)

        reranked_results.sort(
            key=lambda x: x["rerank_score"],
            reverse=True
        )

        return reranked_results[:top_k]