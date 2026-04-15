"""
Request ID middleware — adds a unique ID to every request for traceability.

The request ID is:
- Generated per-request (or taken from X-Request-ID header)
- Attached to the request state
- Included in the response headers
- Available for logging via `request.state.request_id`
"""
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.utils.logger import logger


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Add unique request ID to every request/response for traceability."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Use client-provided ID if present, or generate one
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
        
        # Attach to request state for downstream use
        request.state.request_id = request_id
        
        # Log request
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"from {request.client.host if request.client else 'unknown'}"
        )
        
        response: Response = await call_next(request)
        
        # Include in response headers
        response.headers["X-Request-ID"] = request_id
        
        # Log response
        logger.info(f"[{request_id}] → {response.status_code}")
        
        return response
