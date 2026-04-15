"""
Performance monitoring middleware.

Measures API response time and logs performance metrics.
"""
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from app.utils.logger import logger


class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    Middleware to measure API response time.
    
    Logs:
    - Request path
    - HTTP method
    - Response time in milliseconds
    - Status code
    """
    
    async def dispatch(self, request: Request, call_next):
        """Process request and measure response time."""
        # Start timer
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate response time
        process_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        # Log performance metrics
        logger.info(
            f"API Performance | "
            f"Method: {request.method} | "
            f"Path: {request.url.path} | "
            f"Status: {response.status_code} | "
            f"Time: {process_time:.2f}ms"
        )
        
        # Add response time header
        response.headers["X-Process-Time"] = f"{process_time:.2f}"
        
        return response
