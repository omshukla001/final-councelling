"""
Counsellor Sheet Engine – MongoDB-backed implementation mapping strictly to the V2 unified schema.

Supports two counselling types (JoSAA and CSAB) and two exam types
(JEE Advanced for IITs only, JEE Mains for non-IITs).

MongoDB collections used:
  - historical_cutoffs
  - master_colleges

Field mapping:
  master_colleges.official_josaa_name -> college_name
  branch                                -> branch
  closing_rank                          -> closing_rank
  category                              -> category
  quota                                 -> quota
  gender                                -> gender
"""
import re
from typing import List, Tuple, Dict, Any
from pymongo.database import Database

from app.schemas.counsellor import CounsellorSheetRequest, ProcessedCollege, CounsellorSheetResponse
from app.utils.logger import logger
from app.utils.helpers import safe_int as _safe_int
from app.config import settings

# IIT college names always start with this prefix
IIT_PREFIX = "Indian Institute of Technology"

# CSAB uses different quota names than JoSAA
CSAB_QUOTA_MAP = {
    "AI": "All India",
    "HS": "Home State",
    "OS": "Other State",
}

# _safe_int is now imported from app.utils.helpers

def _build_institute_filter(exam_type: str) -> Dict[str, Any]:
    """
    Build a MongoDB filter for IIT vs non-IIT based on exam type,
    while globally excluding the outdated duplicate 'Indian School of Mines Dhanbad'.
    """
    exclude_ism = {"official_josaa_name": {"$not": {"$regex": r"(?i)Indian School of Mines"}}}
    
    if exam_type == "JEE_ADVANCED":
        # Match only exact IIT prefix to strictly avoid IIITs
        return {
            "$and": [
                {"official_josaa_name": {"$regex": r"^Indian Institute of Technology(?!\s* Information)"}},
                exclude_ism
            ]
        }
    else:
        # Match anything EXCEPT exact IIT prefix
        return {
            "$and": [
                {"official_josaa_name": {"$not": {"$regex": r"^Indian Institute of Technology(?!\s* Information)"}}},
                exclude_ism
            ]
        }

def _resolve_quota(quota: str, counselling_type: str) -> str:
    """Map quota codes for CSAB (which uses full names instead of abbreviations)."""
    if counselling_type == "CSAB":
        return CSAB_QUOTA_MAP.get(quota, quota)
    return quota

async def generate_counsellor_sheet(
    db: Database,
    request: CounsellorSheetRequest
) -> CounsellorSheetResponse:
    user_rank = request.user_rank
    branch_preferences = request.branch_preferences
    buffer_range = request.buffer_range or 2000
    counselling_type = (request.counselling_type or "JOSAA").upper()
    exam_type = (request.exam_type or "JEE_MAINS").upper()
    category = request.category or "OPEN"
    raw_quota = request.quota or "AI"
    gender = request.gender or "Gender-Neutral"

    # Normalize quota to a list
    if isinstance(raw_quota, str):
        quota_list = [raw_quota]
    else:
        quota_list = list(raw_quota)

    # CSAB only supports JEE Mains (no IITs in CSAB)
    if counselling_type == "CSAB":
        exam_type = "JEE_MAINS"

    resolved_quotas = [_resolve_quota(q, counselling_type) for q in quota_list]
    # Build branch regex for broad matching
    # re.escape escapes spaces in older Python versions, which breaks MongoDB regex. We remove the escaped spaces.
    branch_regex_parts = [re.escape(b).replace("\\ ", " ") for b in branch_preferences]
    branch_regex = "|".join(branch_regex_parts)
    
    target_lower_limit = max(0, user_rank - buffer_range)
    target_upper_limit = user_rank + buffer_range

    logger.info(f"Generating counsellor sheet for Rank: {user_rank}, Quotas: {resolved_quotas}, Category: {category}")

    # 1. Fetch valid college IDs from master_colleges based on exam type
    mc_filter = _build_institute_filter(exam_type)
    master_colleges_cursor = db["master_colleges"].find(
        mc_filter, 
        {"college_id": 1, "official_josaa_name": 1, "nirf_ranking": 1, "type": 1}
    )
    
    valid_colleges = {}
    valid_college_ids = []
    
    for mc in master_colleges_cursor:
        cid = mc.get("college_id")
        if cid is not None:
            # Handle DB cases where id is stored as int or str
            valid_colleges[str(cid)] = mc
            valid_college_ids.append(cid)
            if isinstance(cid, int):
                valid_college_ids.append(str(cid))
            elif isinstance(cid, str) and cid.isdigit():
                valid_college_ids.append(int(cid))

    # 2. Query historical_cutoffs directly (NO $lookup)
    query = {
        "college_id": {"$in": valid_college_ids},
        "branch": {"$regex": branch_regex, "$options": "i"},
        "category": category,
        "quota": {"$in": resolved_quotas},
        "gender": {"$in": ["Gender-Neutral", "NA"]} if gender == "Gender-Neutral" else {"$in": [gender, "Female-only (including Supernumerary)", "Female-only"]},
        "year": {"$in": settings.COUNSELLOR_YEARS},
        "closing_rank": {"$gte": target_lower_limit, "$lte": target_upper_limit}
    }

    collection = db["historical_cutoffs"]
    cursor = collection.find(query)

    unique_colleges: Dict[Tuple[str, str], Dict[str, Any]] = {}

    for doc in cursor:
        closing_rank = _safe_int(doc.get("closing_rank"))
        if closing_rank <= 0:
            continue

        raw_cid = doc.get("college_id", "")
        cid_str = str(raw_cid)
        
        # Get college info from our pre-fetched dict
        c_info = valid_colleges.get(cid_str)
        if not c_info:
            continue

        college_name = c_info.get("official_josaa_name", "Unknown")
        branch = doc.get("branch", "Unknown")
        year = doc.get("year", 2024)
        round_num = doc.get("round", 1)
        
        key = (college_name, branch)

        # Keep the latest year/round for each college+branch combo
        if key not in unique_colleges:
            unique_colleges[key] = {
                "college_id": cid_str,
                "college_name": college_name,
                "branch": branch,
                "closing_rank": closing_rank,
                "year": year,
                "round": round_num,
                "nirf_ranking": _safe_int(c_info.get("nirf_ranking", 999)) or 999,
                "tier": 1 if ("Indian Institute of Technology" in college_name and "Information" not in college_name) else
                        2 if ("National Institute of Technology" in college_name or "NIT " in college_name) else
                        3 if ("Indian Institute of Information Technology" in college_name or "IIIT" in college_name) else 4,
            }
        else:
            existing = unique_colleges[key]
            # Replace if this doc is newer or a later round in same year
            if year > existing["year"] or (year == existing["year"] and round_num > existing["round"]):
                unique_colleges[key].update({
                    "closing_rank": closing_rank,
                    "year": year,
                    "round": round_num
                })

    raw_choices = []

    for key, college in unique_colleges.items():
        branch_priority_index = -1
        for i, pref in enumerate(branch_preferences):
            if pref.lower() in college["branch"].lower():
                branch_priority_index = i
                break

        if branch_priority_index == -1:
            continue

        distance_from_rank = abs(user_rank - college["closing_rank"])
        
        if college["closing_rank"] < user_rank - (buffer_range // 3):
            chance = "Dream"
        elif college["closing_rank"] > user_rank + (buffer_range // 3):
            chance = "Safe"
        else:
            chance = "Target"

        # Multi-level priority sort tuple:
        # 1. Branch Preference (User's #1 branch choice comes first across all colleges)
        # 2. Tier (1=IIT, 2=NIT, 3=IIIT, 4=GFTI) ensures "first IIT then NIT"
        # 3. NIRF Ranking (Lower is better)
        # 4. Closing Rank (Proxy for best placements / prestige)
        sort_tuple = (branch_priority_index, college["tier"], college["nirf_ranking"], college["closing_rank"])

        raw_choices.append({
            "college": college,
            "sort_tuple": sort_tuple,
            "distance_from_rank": distance_from_rank,
            "chance": chance
        })

    raw_choices.sort(key=lambda x: x["sort_tuple"])

    # Cap the response to the top 300 results to prevent API payload bloat and OOM crashes
    choices: List[ProcessedCollege] = []
    for idx, item in enumerate(raw_choices[:300]):
        college = item["college"]
        choices.append(ProcessedCollege(
            college_id=college["college_id"],
            college_name=college["college_name"],
            branch=college["branch"],
            closing_rank=college["closing_rank"],
            priority_index=idx + 1,
            distance_from_rank=item["distance_from_rank"],
            chance=item["chance"]
        ))

    return CounsellorSheetResponse(
        choices=choices,
        counselling_type=counselling_type,
        exam_type=exam_type,
        success=True
    )
