"""
Counsellor Engine API route – uses MongoDB.
"""
from fastapi import APIRouter, HTTPException, status
from typing import Any
import json
import os

from app.db.mongo import get_mongo_db
from app.schemas.counsellor import CounsellorSheetRequest, CounsellorSheetResponse
from app.services.counsellor_service import generate_counsellor_sheet

router = APIRouter(tags=["Counsellor"])


@router.post("/counsellor-sheet", response_model=CounsellorSheetResponse)
async def get_counsellor_sheet(request: CounsellorSheetRequest) -> Any:
    """
    Generate counsellor sheet based on user rank and branch preferences.
    Uses MongoDB cutoffs collection directly.
    """
    try:
        db = get_mongo_db()
        response = await generate_counsellor_sheet(db, request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating counsellor sheet: {str(e)}"
        )

@router.get("/filters")
async def get_counsellor_filters() -> Any:
    """
    Return the dynamic list of branches, categories, quotas, and genders
    available across JOSAA and CSAB.
    """
    try:
        filters_path = os.path.join(os.path.dirname(__file__), "..", "..", "utils", "counsellor_filters.json")
        with open(filters_path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading filters: {str(e)}"
        )
