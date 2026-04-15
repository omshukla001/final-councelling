"""
Schemas for AI chat service.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class ChatMessageRequest(BaseModel):
    """Request model for chat message."""
    message: str = Field(..., min_length=1, max_length=1000, description="User's message")
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional context (previous conversation, user preferences)"
    )


class RankPredictionData(BaseModel):
    """Rank prediction data."""
    rank_low: int
    rank_high: int
    confidence: float


class RecommendationsSummary(BaseModel):
    """Summary of recommendations."""
    total_count: int
    safe_count: int
    target_count: int
    dream_count: int
    avg_probability: float


class ChatMessageResponse(BaseModel):
    """Response model for chat message."""
    message: str = Field(..., description="AI response message")
    data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Structured data (rank prediction, recommendations)"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if processing failed"
    )
