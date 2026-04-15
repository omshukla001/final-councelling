"""
Schemas for recommendation service.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class RankPredictorRequest(BaseModel):
    """Request model for rank prediction."""
    percentile: float = Field(..., ge=0, le=100, description="JEE Main percentile")
    total_candidates: int = Field(..., ge=1, description="Total number of candidates")


class RecommendationRequest(BaseModel):
    """Request model for recommendations."""
    rank: int = Field(..., ge=1, description="Candidate's JEE Main rank")
    category: str = Field(..., description="Category: GEN, EWS, OBC-NCL, SC, ST, PWD")
    quota: str = Field(..., description="Quota: AI, HS, OS, etc.")
    gender_pool: Optional[str] = Field(None, description="Gender pool: Gender-Neutral, Female-Only")
    counselling_type: str = Field(default="JOSAA", description="JOSAA or CSAB")
    limit: int = Field(default=50, ge=1, le=10000, description="Maximum number of recommendations")


class RecommendationItem(BaseModel):
    """Individual recommendation item."""
    institute_name: str
    branch_name: str
    round: int
    closing_rank: int
    chance_level: str  # SAFE, TARGET, or DREAM


class RankPredictionResponse(BaseModel):
    """Response model for rank prediction."""
    predicted_rank: Optional[int] = None
    message: str = "Rank predictor coming soon"


class PaginationInfo(BaseModel):
    """Pagination information."""
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool


class RecommendationMetadata(BaseModel):
    """Metadata for recommendations."""
    rank_low: int
    rank_high: int
    rank_mid: float
    category: str
    pwd_flag: bool
    home_state: Optional[str]
    counselling_type: str
    year: int
    total_found: int
    pagination: Optional[PaginationInfo] = None


class RecommendationResponse(BaseModel):
    """Response model for recommendations."""
    recommendations: List[RecommendationItem]
