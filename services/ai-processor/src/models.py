from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class EvaluationRequest(BaseModel):
    questionId: str


class EvaluationScores(BaseModel):
    contextCompleteness: float
    questionQuality: float
    rippleEffect: float
    originality: float
    interactivity: float


class EvaluationResult(BaseModel):
    questionId: str
    scores: EvaluationScores
    totalScore: float
    metadata: Optional[Dict[str, Any]] = None


class SimilarityRequest(BaseModel):
    text: str
    limit: int = 10
    minScore: Optional[float] = 0.7


class QuestionData(BaseModel):
    id: str
    coreQuestion: str
    background: str
    priorKnowledge: str
    attemptedApproach: str
    expectedUse: str
    tags: List[str] = []