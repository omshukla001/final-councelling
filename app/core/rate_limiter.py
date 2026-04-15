"""
Rate limiting middleware using distributed Redis token-bucket approximation,
falling back gracefully to in-memory bucket isolated per worker.

Provides per-IP rate limiting for API endpoints, with stricter
limits on AI/expensive endpoints.
"""
import time
import asyncio
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.utils.logger import logger
from app.config import settings

# Attempt to initialize Redis client for distributed rate limiting
redis_client = None
if settings.REDIS_ENABLED:
    try:
        import redis.asyncio as redis_async
        redis_client = redis_async.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD or None,
            decode_responses=True,
            socket_connect_timeout=2
        )
    except ImportError:
        logger.warning("redis package not installed, falling back to memory rate limits.")
    except Exception as e:
        logger.warning(f"Failed to initialize Redis: {e}")

class _TokenBucket:
    """Simple in-memory token bucket rate limiter (Fallback)."""
    
    def __init__(self, rate: float, capacity: int):
        self.rate = rate          # Tokens per second
        self.capacity = capacity  # Max burst
        self.tokens = capacity
        self.last_refill = time.monotonic()
    
    def consume(self) -> bool:
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_refill = now
        
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False


# ── In-Memory Fallback Buckets ────────────────────────────────────────────────
_buckets: dict[str, _TokenBucket] = defaultdict(lambda: _TokenBucket(rate=2.0, capacity=30))
_ai_buckets: dict[str, _TokenBucket] = defaultdict(lambda: _TokenBucket(rate=0.5, capacity=10))

# Paths that get stricter rate limits
AI_PATHS = {"/api/v1/ai-chat", "/api/v1/counsellor", "/api/v1/rank-prediction"}

_CLEANUP_INTERVAL = 300   # Run cleanup every 5 minutes
_STALE_THRESHOLD = 3600   # Evict entries idle for > 1 hour
_last_cleanup = time.monotonic()


def _cleanup_stale_buckets():
    """Remove memory buckets for IPs that haven't been seen in over an hour."""
    global _last_cleanup
    now = time.monotonic()
    if now - _last_cleanup < _CLEANUP_INTERVAL:
        return
    
    _last_cleanup = now
    stale_cutoff = now - _STALE_THRESHOLD
    
    for bucket_dict in (_buckets, _ai_buckets):
        stale_keys = [ip for ip, bucket in bucket_dict.items() if bucket.last_refill < stale_cutoff]
        for key in stale_keys:
            del bucket_dict[key]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Distributed Rate limiting:
    - General API: 30 req / min
    - AI endpoints: 10 req / min
    """

    async def check_redis_rate_limit(self, client_ip: str, is_ai: bool) -> tuple[bool, int]:
        """Returns (is_allowed, retry_after) using Redis fixed window."""
        limit = 10 if is_ai else 30
        window = 60 # per minute
        
        # Simple fixed window counter: `rate:{ip}:{minute_bucket}`
        minute_bucket = int(time.time() // window)
        key = f"rate_limit:{'ai' if is_ai else 'gen'}:{client_ip}:{minute_bucket}"
        
        try:
            count = await redis_client.incr(key)
            if count == 1:
                await redis_client.expire(key, window + 10)
                
            if count > limit:
                return False, window - (int(time.time()) % window)
            return True, 0
            
        except Exception as e:
            logger.error(f"Redis rate limiting failed, falling back: {e}")
            return None # Trigger fallback

    async def dispatch(self, request: Request, call_next):
        # Skip non-API paths (static files, health checks)
        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        is_ai = any(request.url.path.startswith(p) for p in AI_PATHS)
        
        # 1. Attempt Redis Rate Limiting
        if redis_client:
            redis_result = await self.check_redis_rate_limit(client_ip, is_ai)
            if redis_result is not None:
                is_allowed, retry_after = redis_result
                if not is_allowed:
                    logger.warning(f"Redis Rate limit exceeded for {client_ip} on {request.url.path}")
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too many requests. Please slow down.", "retry_after": retry_after},
                        headers={"Retry-After": str(retry_after)},
                    )
                return await call_next(request)

        # 2. Fallback to Memory Rate Limiting
        _cleanup_stale_buckets()
        
        bucket = _ai_buckets[client_ip] if is_ai else _buckets[client_ip]
        if not bucket.consume():
            retry_after = int(1 / bucket.rate)
            logger.warning(f"Memory Rate limit exceeded for {client_ip} on {request.url.path}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down.", "retry_after": retry_after},
                headers={"Retry-After": str(retry_after)},
            )
        
        return await call_next(request)
