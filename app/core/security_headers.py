"""
Security headers middleware — defense-in-depth HTTP headers.

CSP is relaxed in DEBUG mode to allow external API calls (Firebase, etc.).
In production, a stricter policy is applied.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # XSS filter (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Content Security Policy — relaxed in dev, strict in prod
        if settings.DEBUG:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com "
                "https://*.firebase.com https://api.groq.com wss://*.firebaseio.com https:; "
                "frame-ancestors 'none'"
            )
        else:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' https://checkout.razorpay.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data:; "
                "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com "
                "https://*.firebase.com https://api.groq.com https://*.razorpay.com; "
                "frame-src 'self' https://api.razorpay.com; "
                "frame-ancestors 'none'"
            )

        # HSTS (only meaningful over HTTPS, skip in dev)
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        return response
