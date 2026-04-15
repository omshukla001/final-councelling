"""
User-related schemas.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: str
    firebase_uid: Optional[str] = None
    is_premium: bool = False
    premium_until: Optional[datetime] = None
    ai_message_count: int = 0


class UserCreate(UserBase):
    password: str
    jee_rank: Optional[int] = None
    category: Optional[str] = None
    quota: Optional[str] = None
    home_state: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    jee_rank: Optional[int] = None
    category: Optional[str] = None
    quota: Optional[str] = None
    home_state: Optional[str] = None


class UserResponse(UserBase):
    id: int
    jee_rank: Optional[int] = None
    category: Optional[str] = None
    quota: Optional[str] = None
    home_state: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}


class UserPreferenceCreate(BaseModel):
    preferred_states: Optional[List[str]] = None
    preferred_college_types: Optional[List[str]] = None
    preferred_branches: Optional[List[str]] = None
    min_nirf_rank: Optional[int] = None
    max_nirf_rank: Optional[int] = None
    preferences_json: Optional[Dict[str, Any]] = None


class UserPreferenceResponse(UserPreferenceCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class SavedCollegeCreate(BaseModel):
    college_id: str
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class SavedCollegeResponse(BaseModel):
    id: int
    user_id: int
    college_id: str
    college: Optional[Dict[str, Any]] = None  # Nested college data
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    
    model_config = {"from_attributes": True}
