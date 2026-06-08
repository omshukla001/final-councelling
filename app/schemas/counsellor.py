from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Union


class CounsellorSheetRequest(BaseModel):
    user_rank: int = Field(..., description="The user's rank", json_schema_extra={"example": 15000})
    branch_preferences: List[str] = Field(
        ...,
        max_length=300,
        description="List of preferred branches (partial match against Academic Program Name)",
        json_schema_extra={"example": ["Computer Science", "Information Technology", "Artificial Intelligence"]}
    )
    buffer_range: Optional[int] = Field(2000, description="Buffer range around the user's rank")
    counselling_type: Optional[str] = Field(
        "JOSAA",
        description="Counselling type: JOSAA or CSAB"
    )
    exam_type: Optional[str] = Field(
        "JEE_MAINS",
        description="Exam type: JEE_ADVANCED (IITs only) or JEE_MAINS (all except IITs). CSAB only supports JEE_MAINS."
    )
    category: Optional[Union[str, List[str]]] = Field("OPEN", description="Seat Type(s), e.g. OPEN, OBC-NCL, SC, ST, EWS. Can be a single string or list of strings.")
    quota: Optional[Union[str, List[str]]] = Field("AI", description="Quota(s), e.g. AI (All India), HS (Home State), OS (Other State). Can be a single string or list of strings.")
    gender: Optional[str] = Field("Gender-Neutral", description="Gender pool, e.g. Gender-Neutral, Female-only (including Supernumerary)")


class ProcessedCollege(BaseModel):
    college_id: str
    college_name: str
    branch: str
    closing_rank: int
    priority_index: int
    distance_from_rank: int
    chance: Literal["Dream", "Target", "Safe"]


class CounsellorSheetResponse(BaseModel):
    choices: List[ProcessedCollege]
    counselling_type: str = "JOSAA"
    exam_type: str = "JEE_MAINS"
    success: bool = True
