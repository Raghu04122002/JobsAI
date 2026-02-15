from pydantic import BaseModel, Field


class CRAGAnalysisRequest(BaseModel):
    user_id: int
    question: str = Field(min_length=3)
    top_k: int = Field(default=8, ge=1, le=20)


class CRAGScoreResponse(BaseModel):
    relevance_score: int = Field(ge=1, le=10)
    reasoning: str
