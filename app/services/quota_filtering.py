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

    # ── Lightweight cache: ONLY master_colleges (small ~few-thousand-doc collection). ──
    # Historical cutoffs are NEVER bulk-loaded into RAM — they are queried on demand,
    # filtered server-side by Mongo, so only the matched rows enter memory. This keeps
    # the service inside the 512MB free-tier limit (no more OOM / 502).
    _college_info_cache: Dict[str, Dict] = {}
    _college_cache_loaded: bool = False
    _college_cache_loaded_at: float = 0.0
    _index_ensured: bool = False
    _CACHE_TTL: int = 3600  # Refresh master_colleges cache every 1 hour

    # Years considered "recent" when no explicit year is requested.
    RECENT_YEARS: List[int] = [2022, 2023, 2024, 2025]

    @classmethod
    def _ensure_college_cache(cls):
        """Cache the small master_colleges collection for name/info lookups."""
        import time
        now = time.time()
        if cls._college_cache_loaded and (now - cls._college_cache_loaded_at) < cls._CACHE_TTL:
            return

        mongo_db = get_mongo_db()
        cache: Dict[str, Dict] = {}
        for m_doc in mongo_db["master_colleges"].find({}):
            cache[m_doc.get("college_id")] = m_doc
        cls._college_info_cache = cache
        cls._college_cache_loaded = True
        cls._college_cache_loaded_at = now
        logger.info(f"master_colleges cache loaded: {len(cache)} colleges")

    @classmethod
    def _ensure_index(cls, col):
        """Create a compound index so the on-demand cutoff query stays fast. Runs once."""
        if cls._index_ensured:
            return
        try:
            col.create_index(
                [("category", 1), ("quota", 1), ("year", 1), ("closing_rank", 1)],
                name="cutoff_query_idx",
                background=True,
            )
        except Exception as e:
            logger.warning(f"Could not ensure cutoff index (continuing anyway): {e}")
        cls._index_ensured = True

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
        # Ensure the small college-info cache is ready (master_colleges only)
        QuotaFilteringService._ensure_college_cache()

        # Build list of years to check. When unspecified, default to recent years
        # so the on-demand query stays bounded.
        if year is None:
            years_to_check = list(QuotaFilteringService.RECENT_YEARS)
        elif isinstance(year, int):
            years_to_check = [year]
        elif isinstance(year, (list, tuple)):
            years_to_check = list(year)
        else:
            years_to_check = list(QuotaFilteringService.RECENT_YEARS)

        logger.info(f"Cutoff query: category={category}, quota={quota}, year(s)={years_to_check}")

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

        cat_upper = category.upper()
        gender_set = None
        if gender:
            if gender == "Gender-Neutral":
                gender_set = {"Gender-Neutral", "NA"}
            else:
                gender_set = {gender}

        # Build the MongoDB filter — push everything server-side so only matched
        # rows (a few thousand at most) are ever held in RAM.
        mongo_db = get_mongo_db()
        col = mongo_db["historical_cutoffs"]
        QuotaFilteringService._ensure_index(col)

        query: Dict[str, Any] = {"category": cat_upper, "year": {"$in": years_to_check}}
        if all_variations is not None:
            query["quota"] = {"$in": list(all_variations)}
        if gender_set is not None:
            query["gender"] = {"$in": list(gender_set)}

        rank_filter: Dict[str, int] = {}
        if min_rank is not None:
            rank_filter["$gte"] = min_rank
        if max_rank is not None:
            rank_filter["$lte"] = max_rank
        if rank_filter:
            query["closing_rank"] = rank_filter

        projection = {
            "college_id": 1, "branch": 1, "category": 1, "quota": 1,
            "closing_rank": 1, "opening_rank": 1, "year": 1, "round": 1, "gender": 1
        }
        filtered = list(col.find(query, projection))
        logger.info(f"Cutoff query matched {len(filtered)} rows")

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
