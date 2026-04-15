"""
Recommendation-related schemas.
"""
from pydantic import Field
from typing import Optional, List, Dict, Union
from app.schemas.base import (
    Classification, 
    CollegeResponse,
    BranchResponse,
    CutoffDataResponse
)
from app.schemas.college import CollegeRecommendation
from pydantic import BaseModel


class RankPredictionRequest(BaseModel):
    jee_rank: int = Field(..., gt=0, description="JEE Main rank")
    category: str = Field(..., description="Category: GEN, EWS, OBC-NCL, SC, ST, PWD")
    quota: str = Field(..., description="Quota: HS (Home State) or OS (Other State)")
    home_state: Optional[str] = None
    firebase_uid: Optional[str] = None


class RankPredictionResponse(BaseModel):
    predicted_rank: int
    confidence_range: Dict[str, int]  # {"min": x, "max": y}
    explanation: Optional[str] = None  # AI-generated explanation


class CollegeRecommendationRequest(BaseModel):
    """Request model for college recommendations."""
    rank: int = Field(..., gt=0, description="Candidate's JEE rank")
    exam: Optional[str] = Field(default="JEE Main", description="Exam type: JEE Main or JEE Advanced")
    category: str = Field(..., description="Candidate's category (e.g., GEN, OBC, SC, ST)")
    quota: Union[str, List[str]] = Field(..., description="Quota(s), e.g. AI, HS, OS, AP, JK. Can be a single string or list.")
    gender: Optional[str] = Field(default="Gender-Neutral", description="Gender-Neutral or Female-only (including Supernumerary)")
    counselling_type: str = Field(..., description="Type of counselling (e.g., JOSAA, CSAB, etc.)")
    limit: int = Field(default=50, ge=1, le=10000, description="Maximum number of recommendations to return")
    home_state: Optional[str] = None
    preferred_states: Optional[List[str]] = None
    preferred_college_types: Optional[List[str]] = None
    preferred_branches: Optional[List[str]] = None
    firebase_uid: Optional[str] = None


class CollegeRecommendationResponse(BaseModel):
    recommendations: List[CollegeRecommendation]
    safe_count: int
    target_count: int
    dream_count: int
    total_count: int
    explanation: Optional[str] = None  # AI-generated explanation


class QuotaFilterRequest(BaseModel):
    category: str
    quota: str
    home_state: Optional[str] = None


class ClassificationRequest(BaseModel):
    jee_rank: int
    cutoff_closing_rank: int
    category: str
    quota: str
