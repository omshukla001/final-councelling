"""
Main FastAPI application.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
import asyncio
import httpx
from app.config import settings
from app.utils.logger import logger
from app.middleware.performance import PerformanceMiddleware
from app.core.security_headers import SecurityHeadersMiddleware
from app.core.rate_limiter import RateLimitMiddleware
from app.core.request_id import RequestIdMiddleware


async def keep_alive():
    """Ping own /health every 5 minutes to prevent Render free tier spindown."""
    await asyncio.sleep(60)  # wait for app to fully start
    url = os.getenv("RENDER_EXTERNAL_URL", "http://localhost:8000") + "/health"
    async with httpx.AsyncClient() as client:
        while True:
            try:
                await client.get(url, timeout=10)
            except Exception:
                pass
            await asyncio.sleep(270)  # 4.5 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown logic."""
    # ── Startup ──
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    from app.db.mongo import connect_to_mongo
    connect_to_mongo()

    task = asyncio.create_task(keep_alive())

    yield  # Application runs here

    # ── Shutdown ──
    task.cancel()
    logger.info("Shutting down application")
    from app.db.mongo import close_mongo_connection
    close_mongo_connection()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Counsellor Wala — AI-powered JEE Counselling Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Security headers middleware (outermost — runs on every response)
app.add_middleware(SecurityHeadersMiddleware)

# Rate limiting middleware (per-IP, stricter on AI endpoints)
app.add_middleware(RateLimitMiddleware)

# Performance monitoring middleware
app.add_middleware(PerformanceMiddleware)

# Request ID middleware (innermost — attaches ID to every request)
app.add_middleware(RequestIdMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
from app.api.v1 import api_router
app.include_router(api_router, prefix="/api/v1")


@app.get("/api")
async def root():
    """Root API info endpoint."""
    return {
        "message": f"{settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Serve Frontend Static Files in Production
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")
    
    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    async def serve_frontend(request: Request, full_path: str):
        """Fallback all non-API GET requests to the React index.html for CSR."""
        if full_path.startswith("api/"):
            return {"detail": "API endpoint not found"}
            
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

