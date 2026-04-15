"""
Recommendation Service API — route handlers only.

All data fetching / business logic is delegated to college_data_service.py
and the classification/filtering services.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import logging

from app.schemas.college import (
    CollegeResponse, BranchResponse, CutoffDataResponse, Classification
)
from app.db.mongo import get_mongo_db
from app.schemas.recommendation import (
    CollegeRecommendationRequest, CollegeRecommendationResponse, RankPredictionResponse
)
from app.schemas.college import CollegeRecommendation
from app.services.classification import ClassificationService
from app.services.quota_filtering import QuotaFilteringService
from app.services.college_data_service import (
    fetch_college_list_sync, fetch_filters_sync, fetch_college_detail_sync,
    extract_location, extract_college_type, format_nirf_display,
)
from app.utils.helpers import is_ism_dhanbad

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Recommendation Service"])
__all__ = ["router"]


# ── Caches ────────────────────────────────────────────────────────────────────
_filters_cache: Optional[Dict[str, Any]] = None
_colleges_cache: Optional[List[Dict[str, Any]]] = None


# ── Route: Filters ────────────────────────────────────────────────────────────
@router.get("/college/filters")
async def get_college_filters():
    """Get available filter options (categories, branches, quotas) from MongoDB."""
    from starlette.concurrency import run_in_threadpool
    global _filters_cache
    if _filters_cache is not None:
        return _filters_cache
    try:
        _filters_cache = await run_in_threadpool(fetch_filters_sync)
        return _filters_cache
    except Exception as e:
        logger.error(f"Error fetching filters: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Route: College List ───────────────────────────────────────────────────────
@router.get("/college/list")
async def get_college_list(
    search: Optional[str] = None,
    type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
):
    """Paginated list of colleges from MongoDB."""
    from starlette.concurrency import run_in_threadpool
    global _colleges_cache
    try:
        if _colleges_cache is None:
            _colleges_cache = await run_in_threadpool(fetch_college_list_sync)

        filtered = _colleges_cache
        if search:
            search_terms = search.lower().split()
            filtered = [c for c in filtered if all(term in c["name"].lower() for term in search_terms)]
        if type:
            tl = type.lower()
            filtered = [c for c in filtered if c["type"].lower() == tl]

        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        return {"colleges": filtered[start:end], "total": total, "page": page, "page_size": page_size}
    except Exception as e:
        logger.error(f"Error fetching college list: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Route: Recommendations ────────────────────────────────────────────────────
@router.post("/recommendations", response_model=CollegeRecommendationResponse)
async def get_recommendations(request: CollegeRecommendationRequest, db=Depends(get_mongo_db)) -> CollegeRecommendationResponse:
    """Get college recommendations based on rank. Redacts data beyond top 5 for free users."""
    try:
        from app.constants import normalize_category
        from app.utils.helpers import extract_college_type
        from collections import defaultdict

        cleaned_category = request.category.upper().strip()
        db_category = normalize_category(cleaned_category)

        if isinstance(request.quota, list):
            db_quota = [q.upper().strip() for q in request.quota]
        else:
            db_quota = request.quota.upper().strip()

        logger.info(f"Recommendations: rank={request.rank}, cat={db_category}, quota={db_quota}")

        # Check max rank
        max_rank = ClassificationService.get_max_rank()
        if request.rank > max_rank:
            return CollegeRecommendationResponse(
                recommendations=[], safe_count=0, target_count=0, dream_count=0, total_count=0,
                explanation=f"Your rank ({request.rank}) is higher than the maximum rank ({max_rank})."
            )

        # Query cutoffs
        min_rank_threshold = int(request.rank * 0.75) if request.rank > 0 else 0
        cutoffs = QuotaFilteringService.filter_cutoffs(
            db=None, category=db_category, quota=db_quota, year=None,
            min_rank=min_rank_threshold, counselling_type=request.counselling_type,
            gender=request.gender
        )

        # Group by college+branch, keep latest year
        grouped = defaultdict(list)
        for row in cutoffs:
            grouped[(row.college_id, row.branch_name)].append(row)

        exam_type = getattr(request, 'exam', 'JEE Main')
        pref_branches = request.preferred_branches or []
        filtered_cutoffs = []

        for key, rows in grouped.items():
            rows.sort(key=lambda x: (x.year or 0, getattr(x, 'round', 0)), reverse=True)
            latest_row = rows[0]

            if pref_branches and latest_row.branch_name not in pref_branches:
                continue
            if request.rank > latest_row.closing_rank * 1.25:
                continue

            c_name = latest_row.institute_name or ""
            if is_ism_dhanbad(c_name):
                continue

            ctype = extract_college_type(c_name)
            if exam_type == "JEE Advanced" and ctype != "IIT":
                continue
            if exam_type == "JEE Main" and ctype == "IIT":
                continue

            latest_row.historical_rows = rows
            filtered_cutoffs.append(latest_row)

        filtered_cutoffs.sort(key=lambda x: x.closing_rank)

        # Build recommendations
        recommendations = []
        safe_count = target_count = dream_count = 0

        # Check Premium Status once here
        is_premium = False
        if request.firebase_uid:
            user_record = db["users"].find_one({"firebase_uid": request.firebase_uid})
            if user_record and user_record.get("is_premium"):
                is_premium = True
                # Check premium expiry
                if user_record.get("premium_until"):
                    from datetime import datetime
                    if datetime.utcnow() > user_record["premium_until"]:
                        is_premium = False
                        db["users"].update_one(
                            {"firebase_uid": request.firebase_uid},
                            {"$set": {"is_premium": False}}
                        )

        for row in filtered_cutoffs:
            classification = ClassificationService.classify(
                jee_rank=request.rank, cutoff_closing_rank=row.closing_rank,
                category=db_category, quota=db_quota
            )
            if classification is None:
                continue

            if classification == Classification.SAFE:
                safe_count += 1
            elif classification == Classification.TARGET:
                target_count += 1
            else:
                dream_count += 1

            c_name_resp = row.institute_name or ""
            ctype_resp = extract_college_type(c_name_resp)
            c_info = getattr(row, 'college_info', {})
            nirf_rank = c_info.get("nirf_rank_2024")
            if not isinstance(nirf_rank, int):
                nirf_rank = 999

            # Format fees
            fees_data = c_info.get("fees", {})
            fee_str = "See Details"
            if isinstance(fees_data, dict):
                inst_fees = fees_data.get("institute_fee", [])
                if isinstance(inst_fees, list):
                    for f in inst_fees:
                        if "Tuition Fee" in f.get("fee_type", ""):
                            fee_str = f"₹{f.get('amount', '')}/sem"
                            break

            college = CollegeResponse(
                id=str(row.college_id or 0), code="", name=c_name_resp, type=ctype_resp,
                state=c_info.get("state", "India"), city="", branches=[], fees=fee_str,
                nirf_rank=nirf_rank, image_url=c_info.get("image_url") or c_info.get("logo_url")
            )
            branch = BranchResponse(
                id="0", college_id=str(row.college_id or 0), code="",
                name=row.branch_name, degree_type="B.Tech"
            )
            cutoff_info = CutoffDataResponse(
                id=str(row.id), college_id=str(row.college_id or 0), branch_id="0",
                branch_name=row.branch_name, category=row.category, quota=row.quota,
                closing_rank=row.closing_rank, year=row.year
            )

            # Historical trends
            yr_map = {}
            for r in getattr(row, 'historical_rows', []):
                y = r.year or 0
                rnd = getattr(r, 'round', 0)
                if y not in yr_map or rnd > getattr(yr_map[y], 'round', 0):
                    yr_map[y] = r

            historical_cutoffs = [
                CutoffDataResponse(
                    id=str(h_row.id), college_id=str(h_row.college_id or 0), branch_id="0",
                    branch_name=h_row.branch_name, category=h_row.category, quota=h_row.quota,
                    closing_rank=h_row.closing_rank, year=h_row.year
                )
                for y in sorted(yr_map.keys(), reverse=True)
                for h_row in [yr_map[y]]
            ]

            # ── REDACTION LOGIC ──
            if not is_premium and len(recommendations) >= 5:
                # We redact the strings so they render safely in the frontend without leaking real data
                # Classification is preserved so Target/Safe/Dream counts are perfectly accurate!
                college.name = "Premium Content Locked"
                college.type = "Locked"
                college.state = "***"
                branch.name = "Rank details locked. Upgrade to see."
                cutoff_info.closing_rank = 0
                historical_cutoffs = []

            recommendations.append(CollegeRecommendation(
                college=college, branch=branch, classification=classification,
                cutoff_info=cutoff_info, historical_cutoffs=historical_cutoffs
            ))

            if hasattr(request, 'limit') and request.limit and len(recommendations) >= request.limit:
                break

        explanation = (
            f"Found {len(recommendations)} colleges matching your criteria. "
            f"{safe_count} SAFE, {target_count} TARGET, and {dream_count} DREAM choices."
        )
        return CollegeRecommendationResponse(
            recommendations=recommendations, safe_count=safe_count, target_count=target_count,
            dream_count=dream_count, total_count=len(recommendations), explanation=explanation
        )

    except Exception as e:
        logger.error(f"Error in get_recommendations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "Failed to get recommendations", "message": str(e)})


# ── Route: Health Check ───────────────────────────────────────────────────────
@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}


# ── Route: College Detail ─────────────────────────────────────────────────────
@router.get("/college/{college_id}")
async def get_college_by_id(college_id: str):
    """Get a single college by ID with full details."""
    from starlette.concurrency import run_in_threadpool
    try:
        response_data = await run_in_threadpool(fetch_college_detail_sync, college_id)
        if response_data is None:
            raise HTTPException(status_code=404, detail="College not found")
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching college {college_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch college")
