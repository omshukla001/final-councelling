"""
Shared base schemas to avoid circular imports.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum

class Classification(str, Enum):
    SAFE = "SAFE"
    TARGET = "TARGET"
    DREAM = "DREAM"
    AMBITIONS = "AMBITIONS"

class CollegeResponse(BaseModel):
    id: str  # Changed from int
    code: str
    name: str
    type: str  # IIT, NIT, IIIT, GFTI
    state: str
    city: str
    branches: List['BranchResponse']
    fees: Optional[str] = None
    nirf_rank: Optional[int] = None
    image_url: Optional[str] = None

class BranchResponse(BaseModel):
    id: str  # Changed from int
    college_id: str  # Changed from int
    code: str
    name: str
    degree_type: str  # B.Tech, B.Arch, etc.

class CutoffDataResponse(BaseModel):
    id: str  # Changed from int
    college_id: str  # Changed from int
    branch_id: str  # Changed from int (though we might not use branch_id)
    branch_name: str
    category: str
    quota: str
    closing_rank: int
    year: int

class CollegeRecommendation(BaseModel):
    college: CollegeResponse
    branch: BranchResponse
    classification: Classification
    cutoff_info: CutoffDataResponse
