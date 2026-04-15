"""
Schemas for college routes.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class CollegeDetailsResponse(BaseModel):
    """Response model for college details."""
    college_id: str
    name: str
    state: str
    nirf_rank: Optional[int] = None
    academic_rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    placement_rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    avg_package: Optional[float] = None
    description: Optional[str] = None
    branches: Optional[List[Dict[str, Any]]] = []
    placements: Optional[List[Dict[str, Any]]] = []


class CompareCollegesRequest(BaseModel):
    """Request model for comparing colleges."""
    college_ids: List[str] = Field(..., min_items=2, max_items=2, description="Exactly 2 college IDs to compare")


class CollegeComparisonItem(BaseModel):
    """Individual college in comparison."""
    college_id: str
    name: str
    state: str
    nirf_rank: Optional[int] = None
    academic_rating: Optional[float] = None
    placement_rating: Optional[float] = None
    avg_package: Optional[float] = None
    description: Optional[str] = None


class CutoffComparisonItem(BaseModel):
    """Cutoff comparison item."""
    branch_name: str
    opening_rank: Optional[int] = None
    closing_rank: int


class RatingComparison(BaseModel):
    """Rating comparison."""
    college_1: Optional[float] = None
    college_2: Optional[float] = None
    better: Optional[str] = Field(None, description="Which college is better: 'college_1' or 'college_2'")


class RankComparison(BaseModel):
    """Rank comparison."""
    college_1: Optional[int] = None
    college_2: Optional[int] = None
    better: Optional[str] = Field(None, description="Which college is better: 'college_1' or 'college_2'")


class ComparisonMatrix(BaseModel):
    """Comparison matrix."""
    ratings: Dict[str, RatingComparison]
    cutoffs: Optional[Dict[str, List[CutoffComparisonItem]]] = None


class CompareCollegesResponse(BaseModel):
    """Response model for college comparison."""
    college_1: CollegeComparisonItem
    college_2: CollegeComparisonItem
    comparison: ComparisonMatrix
