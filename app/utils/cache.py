"""
Redis cache utilities with lazy initialization and graceful fallback.

If REDIS_ENABLED=false in config, all cache operations become no-ops
so the app can run without Redis in development.
"""
import json
import redis
from typing import Optional, Any
from app.config import settings
from app.utils.logger import logger

# ── Lazy Redis client ────────────────────────────────────────────────────────
_redis_client: Optional[redis.Redis] = None
_redis_available: bool = False


def _get_redis() -> Optional[redis.Redis]:
    """Lazy-initialize Redis connection. Returns None if disabled or unavailable."""
    global _redis_client, _redis_available

    if not settings.REDIS_ENABLED:
        return None

    if _redis_client is not None:
        return _redis_client if _redis_available else None

    try:
        pool = redis.ConnectionPool(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            decode_responses=True,
            max_connections=50,
            socket_connect_timeout=3,
        )
        client = redis.Redis(connection_pool=pool)
        client.ping()  # Test connection
        _redis_client = client
        _redis_available = True
        logger.info(f"Redis connected at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        return _redis_client
    except Exception as e:
        _redis_client = redis.Redis()  # Placeholder to avoid re-trying every call
        _redis_available = False
        logger.warning(f"Redis unavailable ({e}). Caching disabled — using no-op fallback.")
        return None


class CacheService:
    """Cache service for Redis operations with graceful degradation."""

    @staticmethod
    def get(key: str) -> Optional[Any]:
        """Get value from cache."""
        client = _get_redis()
        if not client:
            return None
        try:
            value = client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.debug(f"Cache GET failed for {key}: {e}")
            return None

    @staticmethod
    def set(key: str, value: Any, ttl: int = 3600) -> bool:
        """Set value in cache with TTL."""
        client = _get_redis()
        if not client:
            return False
        try:
            client.setex(
                key,
                ttl,
                json.dumps(value, default=str)
            )
            return True
        except Exception as e:
            logger.debug(f"Cache SET failed for {key}: {e}")
            return False

    @staticmethod
    def delete(key: str) -> bool:
        """Delete key from cache."""
        client = _get_redis()
        if not client:
            return False
        try:
            client.delete(key)
            return True
        except Exception as e:
            logger.debug(f"Cache DELETE failed for {key}: {e}")
            return False

    @staticmethod
    def delete_pattern(pattern: str) -> int:
        """Delete all keys matching pattern."""
        client = _get_redis()
        if not client:
            return 0
        try:
            keys = client.keys(pattern)
            if keys:
                return client.delete(*keys)
            return 0
        except Exception as e:
            logger.debug(f"Cache DELETE_PATTERN failed for {pattern}: {e}")
            return 0

    @staticmethod
    def exists(key: str) -> bool:
        """Check if key exists."""
        client = _get_redis()
        if not client:
            return False
        try:
            return client.exists(key) > 0
        except Exception:
            return False


# Cache key generators
class CacheKeys:
    """Centralized cache key generation."""

    @staticmethod
    def rank_prediction(user_id: str, rank: int, category: str) -> str:
        return f"rank_prediction:{user_id}:{rank}:{category}"

    @staticmethod
    def college_recommendations(user_id: str, rank: int, category: str, quota: str) -> str:
        return f"college_recommendations:{user_id}:{rank}:{category}:{quota}"

    @staticmethod
    def college_profile(college_id: str) -> str:
        return f"college_profile:{college_id}"

    @staticmethod
    def college_comparison(college_ids: list) -> str:
        sorted_ids = sorted(college_ids)
        return f"college_comparison:{':'.join(map(str, sorted_ids))}"

    @staticmethod
    def user_preferences(user_id: str) -> str:
        return f"user_preferences:{user_id}"

    @staticmethod
    def saved_colleges(user_id: str) -> str:
        return f"saved_colleges:{user_id}"

    @staticmethod
    def recommendation_by_percentile(percentile: float, category: str, state: Optional[str] = None) -> str:
        """Cache key for recommendations based on percentile, category, and state."""
        state_part = state.upper() if state else "ALL"
        return f"recommendation:{percentile:.2f}:{category}:{state_part}"
