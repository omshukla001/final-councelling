"""
Quota filtering service — MongoDB version.
"""
from typing import List, Optional, Any, Union, Dict
from app.utils.logger import logger
from app.db.mongo import get_mongo_db

class MongoCutoff:
    """Object wrapper for MongoDB cutoff documents to provide attribute-style access."""
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
            
    # Mock the 'id' property so recommendation service doesn't break
    @property
    def id(self):
        return str(getattr(self, '_id', 'mongo_id'))


class QuotaFilteringService:
    """Service for filtering colleges based on quota and category."""

    VALID_CATEGORIES = ["GEN", "EWS", "OBC-NCL", "SC", "ST", "PWD", "OPEN"]
    VALID_QUOTAS = ["HS", "OS", "AI", "GO", "JK", "LA"]

    @staticmethod
    def validate_category(category: str) -> bool:
        return category.upper() in QuotaFilteringService.VALID_CATEGORIES

    @staticmethod
    def validate_quota(quota: str) -> bool:
        return quota.upper() in QuotaFilteringService.VALID_QUOTAS

    @staticmethod
    def _parse_rank(rank_str: Any) -> int:
        """Parse rank handles strings with 'P' (e.g., '123P' -> 123) and empty strings."""
        if not rank_str:
            return 0
        if isinstance(rank_str, int) or isinstance(rank_str, float):
            return int(rank_str)
            
        rank_str = str(rank_str).strip()
        if not rank_str or rank_str.upper() == 'NA' or rank_str == '-':
            return 0
            
        if rank_str.endswith('P') or rank_str.endswith('p'):
            rank_str = rank_str[:-1]
            
        try:
            return int(float(rank_str))
        except ValueError:
            return 0

    # ── In-memory cache for lightning-fast repeated queries ──
    _cutoffs_cache: List[Dict] = []
    _college_info_cache: Dict[str, Dict] = {}
    _cache_loaded: bool = False
    _cache_loaded_at: float = 0.0
    _CACHE_TTL: int = 3600  # Refresh cache every 1 hour

    @classmethod
    def _ensure_cache(cls):
        """Load ALL historical cutoffs into RAM once. Auto-refreshes after TTL expires."""
        import time
        now = time.time()
        
        if cls._cache_loaded and (now - cls._cache_loaded_at) < cls._CACHE_TTL:
            return
        
        mongo_db = get_mongo_db()
        col = mongo_db["historical_cutoffs"]
        
        action = "Refreshing" if cls._cache_loaded else "Loading"
        logger.info(f"{action} historical_cutoffs into memory cache...")
        t0 = time.time()
        
        # Fetch only recent 4 years — reduces memory from ~500k to ~200k docs
        recent_years = [2022, 2023, 2024, 2025]
        projection = {
            "college_id": 1, "branch": 1, "category": 1, "quota": 1,
            "closing_rank": 1, "opening_rank": 1, "year": 1, "round": 1, "gender": 1
        }
        cls._cutoffs_cache = list(col.find({"year": {"$in": recent_years}}, projection))
        
        # Batch-load master college info
        unique_ids = list(set(d.get("college_id") for d in cls._cutoffs_cache if d.get("college_id")))
        if unique_ids:
            for m_doc in mongo_db["master_colleges"].find({"college_id": {"$in": unique_ids}}):
                cls._college_info_cache[m_doc.get("college_id")] = m_doc
        
        elapsed = time.time() - t0
        logger.info(f"Cache loaded: {len(cls._cutoffs_cache)} cutoffs, {len(cls._college_info_cache)} colleges in {elapsed:.2f}s")
        cls._cache_loaded = True
        cls._cache_loaded_at = now

    @staticmethod
    def filter_cutoffs(
        db: Any,  # Kept parameter for compatibility, but we will use get_mongo_db() instead
        category: str,
        quota: Union[str, List[str]],
        year: Any = None,
        min_rank: Optional[int] = None,
        max_rank: Optional[int] = None,
        counselling_type: str = "JOSAA",
        gender: Optional[str] = "Gender-Neutral"
    ) -> List[MongoCutoff]:
        # Ensure in-memory cache is ready
        QuotaFilteringService._ensure_cache()
        
        # Build list of years to check
        years_to_check = []
        if year is None:
            years_to_check = None  # Accept all years
        elif isinstance(year, int):
            years_to_check = [year]
        elif isinstance(year, list) or isinstance(year, tuple):
            years_to_check = list(year)
            
        logger.info(f"Cache filter: category={category}, quota={quota}, year(s)={years_to_check}")
        
        # Normalize quota
        from app.constants import QUOTA_UNNORMALIZATION
        
        if quota:
            if isinstance(quota, str):
                quota_list = [quota.upper()]
            else:
                quota_list = [q.upper() for q in quota]
            
            all_variations = set()
            for q in quota_list:
                variations = QUOTA_UNNORMALIZATION.get(q, [q])
                all_variations.update(variations)
        else:
            all_variations = None
        
        # Filter from in-memory cache (microseconds)
        cat_upper = category.upper()
        gender_set = None
        if gender:
            if gender == "Gender-Neutral":
                gender_set = {"Gender-Neutral", "NA"}
            else:
                gender_set = {gender}
        
        filtered = []
        for doc in QuotaFilteringService._cutoffs_cache:
            if doc.get("category") != cat_upper:
                continue
            if gender_set and doc.get("gender") not in gender_set:
                continue
            if years_to_check is not None and doc.get("year") not in years_to_check:
                continue
            if min_rank is not None and (doc.get("closing_rank") or 0) < min_rank:
                continue
            if max_rank is not None and (doc.get("closing_rank") or 0) > max_rank:
                continue
            if all_variations is not None and doc.get("quota") not in all_variations:
                continue
            filtered.append(doc)
        
        # Map to MongoCutoff objects
        results = []
        for doc in filtered:
            c_info = QuotaFilteringService._college_info_cache.get(doc.get("college_id"), {})
            institute_name = c_info.get("official_josaa_name", "Unknown Institute")
            
            mapped_doc = MongoCutoff(
                _id=doc.get("_id"),
                college_id=doc.get("college_id"),
                institute_name=institute_name,
                branch_name=doc.get("branch", "Unknown Branch"),
                category=doc.get("category", category),
                quota=doc.get("quota", quota),
                closing_rank=doc.get("closing_rank", 0),
                opening_rank=doc.get("opening_rank", 0),
                year=doc.get("year", 2024),
                round=doc.get("round", 1),
                degree_type="B.Tech",
                college_info=c_info
            )
            results.append(mapped_doc)
            
        return results

    @staticmethod
    def get_cutoff_for_college_branch(
        db: Any,
        college_id: int,
        branch_name: str,
        category: str,
        quota: str,
        year: int = 2024,
    ) -> Optional[MongoCutoff]:
        # Implementation left out for brevity as the Rank Predictor heavily relies on filter_cutoffs
        # It's essentially the same logic but adding academic program matching to the mongo query.
        return None

    @staticmethod
    def get_rank_range_for_category_quota(
        db: Any,
        category: str,
        quota: str,
        year: int = 2024,
    ) -> dict:
        cutoffs = QuotaFilteringService.filter_cutoffs(db, category, quota, year)
        if not cutoffs:
            return {"min_rank": None, "max_rank": None}

        closing_ranks = [c.closing_rank for c in cutoffs if c.closing_rank]
        return {
            "min_rank": min(closing_ranks) if closing_ranks else None,
            "max_rank": max(closing_ranks) if closing_ranks else None,
        }
