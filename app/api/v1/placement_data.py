"""
Placement Data API endpoint.

Serves highly structured placement data fetched directly from the unified master_colleges collection.
"""
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Placement Data"])

# Cache: college_id -> parsed placement data
_placement_cache: Dict[str, Any] = {}

@router.get("/{college_id}")
async def get_placement_data(college_id: str):
    """
    Get enriched placement data and highest packages for a college from the master_colleges MongoDB collection.
    """
    if college_id in _placement_cache:
        return _placement_cache[college_id]

    try:
        from app.db.mongo import get_mongo_db
        db = get_mongo_db()
        
        # Query the unified V2 schema
        doc = db["master_colleges"].find_one({"college_id": college_id}, {"_id": 0, "official_josaa_name": 1, "placements": 1})
        
        if not doc or "placements" not in doc:
            return {"found": False, "college_id": college_id, "data": None}
            
        result = {
            "found": True,
            "college_name": doc.get("official_josaa_name"),
            "data": doc.get("placements")
        }

        # Cache it
        _placement_cache[college_id] = result
        return result

    except Exception as e:
        logger.error(f"Error reading placement data for ID {college_id} from MongoDB: {e}", exc_info=True)
        return {"found": False, "college_id": college_id, "data": None}
