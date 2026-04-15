"""
College data service — handles all college data retrieval and processing logic.

Extracted from recommendation_service.py to separate data/business logic
from route handler concerns.
"""
import re
import json
import os
import logging
from typing import Dict, Any, List, Optional
from collections import defaultdict

from app.utils.helpers import extract_college_type, is_ism_dhanbad

logger = logging.getLogger(__name__)

# ── Location mapping — loaded from external data file ──
_location_map_path = os.path.join(os.path.dirname(__file__), "..", "data", "location_map.json")
try:
    with open(_location_map_path, "r", encoding="utf-8") as _f:
        _LOCATION_MAP: Dict[str, str] = json.load(_f)
except FileNotFoundError:
    logger.warning(f"location_map.json not found at {_location_map_path}, using empty map")
    _LOCATION_MAP = {}

# Pre-sort keys by length (longest first) for correct matching
_LOCATION_KEYS_SORTED = sorted(_LOCATION_MAP.keys(), key=len, reverse=True)


def extract_location(institute_name: str) -> str:
    """Extract city, state from institute name using the location map."""
    for key in _LOCATION_KEYS_SORTED:
        if key.lower() in institute_name.lower():
            return _LOCATION_MAP[key]
    return ""


def parse_nirf_rank(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract the best NIRF rank from a college document's 'rankings' array.
    Prefers 'NIRF Engineering Rankings' over 'NIRF Overall'.
    Returns dict with 'nirf_rank' (int or None), 'nirf_display' (str), etc.
    """
    result = {"nirf_rank": None, "nirf_display": None, "nirf_category": None, "nirf_year": None}
    rankings = doc.get("rankings", [])
    if not isinstance(rankings, list) or len(rankings) == 0:
        return result

    nirf_entries = []
    for r in rankings:
        if not isinstance(r, list) or len(r) < 3:
            continue
        category = str(r[1]) if r[1] else ""
        if "NIRF" not in category:
            continue
        raw_value = str(r[2]).strip()
        year = None
        year_match = re.search(r'\((\d{4})\)', raw_value)
        if year_match:
            year = int(year_match.group(1))
        rank_part = raw_value.split('(')[0].strip()
        is_engineering = "Engineering" in category
        nirf_entries.append({
            "category": category, "rank_str": rank_part,
            "year": year, "is_engineering": is_engineering, "raw": raw_value,
        })

    if not nirf_entries:
        return result

    nirf_entries.sort(key=lambda x: (
        1 if x["is_engineering"] else 0,
        x["year"] or 0,
        0 if '-' in x["rank_str"] else 1,
    ), reverse=True)

    best = nirf_entries[0]
    rank_str = best["rank_str"]

    if '-' in rank_str:
        parts = rank_str.split('-')
        try:
            low, high = int(parts[0]), int(parts[1])
            result["nirf_rank"] = (low + high) // 2
            result["nirf_display"] = rank_str
        except (ValueError, IndexError):
            result["nirf_display"] = rank_str
    else:
        try:
            result["nirf_rank"] = int(rank_str)
            result["nirf_display"] = f"#{rank_str}"
        except ValueError:
            result["nirf_display"] = rank_str

    result["nirf_category"] = "Engineering" if best["is_engineering"] else "Overall"
    result["nirf_year"] = best["year"]
    return result


def format_nirf_display(nirf_rank: Optional[int]) -> Optional[str]:
    """Convert a numeric NIRF rank to a display string (handles band ranges)."""
    if not nirf_rank or nirf_rank <= 0:
        return None
    band_map = {125: "101-150", 175: "151-200", 250: "201-300"}
    return band_map.get(nirf_rank, f"#{nirf_rank}")


def clean_display_name(name: str, location_str: str) -> str:
    """Remove redundant trailing state name from the college display name."""
    if not location_str:
        return name
    parts = [p.strip() for p in location_str.split(",")]
    state = parts[-1] if parts else ""
    if state and name.endswith(" " + state):
        candidate = name[: -(len(state) + 1)].strip()
        if state.lower() in candidate.lower() and len(candidate) >= 10:
            name = candidate
    return name


def fetch_college_list_sync() -> List[Dict[str, Any]]:
    """Build the full college list from master_colleges collection."""
    from app.db.mongo import get_mongo_db
    mongo_db = get_mongo_db()
    colleges_list = []

    for doc in mongo_db["master_colleges"].find(
        {}, {"college_id": 1, "official_josaa_name": 1, "state": 1, "type": 1, "nirf_engineering_rank": 1, "image_url": 1, "logo_url": 1}
    ):
        c_name = doc.get("official_josaa_name", "")
        if not c_name or is_ism_dhanbad(c_name):
            continue

        location_str = doc.get("state", extract_location(c_name))
        display_name = clean_display_name(c_name, location_str)
        nirf_rank = doc.get("nirf_engineering_rank")
        nirf_display = format_nirf_display(nirf_rank) if nirf_rank and nirf_rank > 0 else None
        if not (nirf_rank and nirf_rank > 0):
            nirf_rank = None

        colleges_list.append({
            "college_id": doc.get("college_id"),
            "name": display_name, "state": location_str,
            "nirf_rank": nirf_rank, "nirf_display": nirf_display,
            "type": doc.get("type", "GFTI"),
            "image_url": doc.get("image_url") or doc.get("logo_url")
        })

    colleges_list.sort(key=lambda x: x["name"])
    return colleges_list


def fetch_filters_sync() -> Dict[str, Any]:
    """Build filters cache from MongoDB (categories, branches, quotas, genders)."""
    from app.db.mongo import get_mongo_db
    from app.constants import QUOTA_NORMALIZATION
    mongo_db = get_mongo_db()
    col = mongo_db["historical_cutoffs"]

    categories = [str(v).strip() for v in col.distinct("category") if v and str(v).strip() and str(v).strip().lower() != "nan"]
    branches = [str(v).strip() for v in col.distinct("branch") if v and str(v).strip() and str(v).strip().lower() != "nan"]

    quotas = set()
    for q in col.distinct("quota"):
        if q and str(q).strip() and str(q).strip().lower() != "nan":
            q_str = str(q).strip()
            normalized_q = QUOTA_NORMALIZATION.get(q_str.lower(), q_str)
            quotas.add(normalized_q)

    genders = [str(v).strip() for v in col.distinct("gender") if v and str(v).strip() and str(v).strip().lower() != "nan"]

    filters_path = os.path.join(os.path.dirname(__file__), "..", "utils", "counsellor_filters.json")
    try:
        with open(filters_path, "r") as f:
            c_filters = json.load(f)
            exam_branches = {
                "JEE Main": c_filters.get("JEE_MAINS", {}).get("branches", sorted(set(branches))),
                "JEE Advanced": c_filters.get("JEE_ADVANCED", {}).get("branches", sorted(set(branches)))
            }
    except Exception:
        exam_branches = {"JEE Main": sorted(set(branches)), "JEE Advanced": sorted(set(branches))}

    return {
        "categories": sorted(set(categories)), "branches": sorted(set(branches)),
        "quotas": sorted(quotas), "genders": sorted(set(genders)),
        "examBranches": exam_branches,
    }


def fetch_college_detail_sync(college_id: str) -> Dict[str, Any]:
    """Fetch a single college's full detail (base info + cutoffs + branches)."""
    from app.db.mongo import get_mongo_db
    db = get_mongo_db()

    college_doc = db["master_colleges"].find_one({"college_id": college_id}, {"_id": 0})
    if not college_doc:
        return None

    response_data = {
        "college_id": college_doc.get("college_id"),
        "name": college_doc.get("official_josaa_name", ""),
        "state": college_doc.get("state", ""),
        "type": college_doc.get("type", "GFTI"),
        "image_url": college_doc.get("image_url") or college_doc.get("logo_url")
    }

    nirf_rank = college_doc.get("nirf_engineering_rank")
    response_data["nirf_rank"] = nirf_rank if nirf_rank and nirf_rank > 0 else None
    response_data["nirf_display"] = format_nirf_display(nirf_rank) if nirf_rank and nirf_rank > 0 else None
    response_data["scraped_data"] = college_doc

    # Fetch cutoffs
    raw_cutoffs = []
    for d in db["historical_cutoffs"].find({"college_id": college_id, "category": "OPEN"}):
        raw_cutoffs.append({
            "branch_name": d.get("branch", "Unknown"), "quota": d.get("quota", "AI"),
            "year": d.get("year", 2024), "round": d.get("round", 1),
            "closing_rank": d.get("closing_rank", 0), "opening_rank": d.get("opening_rank", 0),
        })

    # Group by branch
    b_map = defaultdict(list)
    for rc in raw_cutoffs:
        if rc["closing_rank"] > 0:
            b_map[rc["branch_name"]].append(rc)

    q_score = {"AI": 1, "OS": 2, "HS": 3, "GO": 4, "JK": 5, "LA": 6}
    branches_payload = []

    for b_name, b_cutoffs in b_map.items():
        y_map = defaultdict(list)
        for c in b_cutoffs:
            y_map[c["year"]].append(c)

        trend = []
        for y, y_list in y_map.items():
            max_rnd = max(c["round"] for c in y_list)
            rnd_list = [c for c in y_list if c["round"] == max_rnd]
            rnd_list.sort(key=lambda x: q_score.get(x["quota"].upper(), 99))
            if rnd_list:
                best = rnd_list[0]
                trend.append({"year": best["year"], "round": best["round"],
                              "closing_rank": best["closing_rank"], "opening_rank": best["opening_rank"]})

        trend.sort(key=lambda x: x["year"], reverse=True)
        branches_payload.append({"name": b_name, "total_entries": len(b_cutoffs), "cutoff_trend": trend})

    branches_payload.sort(key=lambda b: b["cutoff_trend"][0]["closing_rank"] if b["cutoff_trend"] else 9999999)

    response_data["branches"] = branches_payload
    response_data["branch_count"] = len(branches_payload)
    years_set = set()
    for b in branches_payload:
        for t in b["cutoff_trend"]:
            years_set.add(t["year"])
    response_data["available_years"] = sorted(list(years_set), reverse=True)

    return response_data
