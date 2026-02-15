from typing import Any, Dict, List

import chromadb
from django.conf import settings

from .openai_client import get_openai_client

_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
_collection = _client.get_or_create_collection('career_copilot')


def _embed(texts: List[str]) -> List[List[float]]:
    client = get_openai_client()
    result = client.embeddings.create(model=settings.OPENAI_EMBEDDING_MODEL, input=texts)
    return [row.embedding for row in result.data]


def upsert_documents(ids: List[str], documents: List[str], metadatas: List[Dict[str, Any]]) -> None:
    vectors = _embed(documents)
    _collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=vectors)


def query_documents(user_id: int, query: str, top_k: int = 8) -> List[Dict[str, Any]]:
    vector = _embed([query])[0]
    result = _collection.query(
        query_embeddings=[vector],
        n_results=top_k,
        where={'user_id': user_id},
    )
    ids = result.get('ids', [[]])[0]
    docs = result.get('documents', [[]])[0]
    metas = result.get('metadatas', [[]])[0]
    distances = result.get('distances', [[]])[0]
    return [
        {
            'id': ids[i],
            'text': docs[i],
            'metadata': metas[i],
            'distance': distances[i] if i < len(distances) else None,
        }
        for i in range(len(ids))
    ]
