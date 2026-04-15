"""
College-related schemas.
"""
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Import from base to avoid circular imports
from app.schemas.base import (
    Classification,
    CollegeResponse as BaseCollegeResponse,
    BranchResponse as BaseBranchResponse,
    CutoffDataResponse as BaseCutoffDataResponse,
    CollegeRecommendation as BaseCollegeRecommendation
)
from pydantic import BaseModel


class CollegeType(str, Enum):
    IIT = "IIT"
    NIT = "NIT"
    IIIT = "IIIT"
    GFTI = "GFTI"
    OTHER = "OTHER"


class BranchBase(BaseModel):
    code: str
    name: str
    degree_type: str


class BranchResponse(BaseBranchResponse):
    total_seats: Optional[int] = None
    
    model_config = {"from_attributes": True}


class CollegeBase(BaseModel):
    code: str
    name: str
    type: CollegeType
    state: str
    city: str


class CollegeCreate(CollegeBase):
    nirf_rank: Optional[int] = None
    overall_rating: Optional[float] = None
    description: Optional[str] = None
    website: Optional[str] = None
    established_year: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class CollegeResponse(BaseCollegeResponse):
    nirf_rank: Optional[int] = None
    overall_rating: Optional[float] = None
    description: Optional[str] = None
    website: Optional[str] = None
    established_year: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    branches: List[BranchResponse] = []
    
    model_config = {"from_attributes": True}


class CollegeProfileResponse(CollegeResponse):
    """Extended college profile with cutoff data."""
    cutoff_summary: Optional[Dict[str, Any]] = None
    
    model_config = {"from_attributes": True}


class CutoffDataResponse(BaseCutoffDataResponse):
    opening_rank: Optional[int] = None
    
    model_config = {"from_attributes": True}


class CollegeRecommendation(BaseCollegeRecommendation):
    """Extended college recommendation with additional fields."""
    predicted_rank_range: Optional[Dict[str, int]] = None
    probability_score: Optional[float] = None
    historical_cutoffs: List[CutoffDataResponse] = []


class CollegeComparisonRequest(BaseModel):
    college_ids: List[str] = Field(..., min_length=2, max_length=5)
class CollegeComparisonResponse(BaseModel):
    colleges: List[CollegeResponse]
    comparison_matrix: Dict[str, List[Any]]  # Feature comparison
    recommendations: Optional[str] = None  # AI-generated comparison summary
