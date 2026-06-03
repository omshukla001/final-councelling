"""
Application configuration using Pydantic Settings.
"""
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List, Optional
import logging

# Use stdlib logger here to avoid circular import with app.utils.logger
_config_logger = logging.getLogger("app.config")


class Settings(BaseSettings):
    """Application settings."""
    
    # App
    APP_NAME: str = "Counsellor Wala"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = ""  # REQUIRED in production — set in .env

    # Auth
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OTP_SECRET_SALT: str = ""  # REQUIRED in production — set in .env
    
    # Payments
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Firebase Admin SDK credentials — supply ONE of:
    #   FIREBASE_CREDENTIALS_JSON   : the full service-account JSON as a single-line string
    #   FIREBASE_CREDENTIALS_BASE64 : the service-account JSON, base64-encoded (safer in CI/env)
    #   FIREBASE_CREDENTIALS_PATH   : filesystem path to the JSON (mounted as a secret)
    # If none are set, auth falls back to the legacy file next to run.py (dev convenience only).
    FIREBASE_CREDENTIALS_JSON: str = ""
    FIREBASE_CREDENTIALS_BASE64: str = ""
    FIREBASE_CREDENTIALS_PATH: str = ""

    # Database (MongoDB)
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "councler_v2"

    # Redis (optional caching layer)
    REDIS_ENABLED: bool = False  # Set to True in .env when Redis is available
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""

    # AI / LLM
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROK_API_KEY: str = ""           # Groq API key (OpenAI-compatible)
    GROQ_API_KEY: str = ""           # Alias — takes priority over GROK_API_KEY
    AI_PROVIDER: str = "groq"
    GENERATION_MODEL: str = "llama-3.3-70b-versatile"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    AI_TOP_K: int = 6
    
    # Pinecone (Vector Search)
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "colleges"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8080"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [i.strip() for i in self.CORS_ORIGINS.split(",") if i.strip()]

    @property
    def effective_groq_key(self) -> str:
        """Return the Groq API key, preferring GROQ_API_KEY over legacy GROK_API_KEY."""
        return self.GROQ_API_KEY or self.GROK_API_KEY

    # Cache TTL (seconds)
    CACHE_TTL_RANK_PREDICTION: int = 3600
    CACHE_TTL_COLLEGE_RECOMMENDATIONS: int = 1800
    CACHE_TTL_COLLEGE_PROFILE: int = 7200
    CACHE_TTL_COMPARISON: int = 1800
    
    # Counsellor Sheet
    COUNSELLOR_YEARS: List[int] = [2024, 2023, 2022]

    model_config = ConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()

# ── Startup validation ───────────────────────────────────────────────────────
if not settings.DEBUG:
    # In production, secrets MUST be explicitly set
    if not settings.SECRET_KEY:
        raise ValueError("SECRET_KEY must be set in production (.env). Cannot start with empty key.")
    if not settings.OTP_SECRET_SALT:
        raise ValueError("OTP_SECRET_SALT must be set in production (.env). Cannot start with empty salt.")
else:
    # In dev, warn but allow empty secrets with safe defaults
    if not settings.SECRET_KEY:
        settings.SECRET_KEY = "dev-only-insecure-key-do-not-use-in-prod"
        _config_logger.warning("SECRET_KEY is empty — using insecure dev default. Set it in .env for production.")
    if not settings.OTP_SECRET_SALT:
        settings.OTP_SECRET_SALT = "dev-only-insecure-salt-do-not-use-in-prod"
        _config_logger.warning("OTP_SECRET_SALT is empty — using insecure dev default. Set it in .env for production.")

if not settings.MONGO_URI:
    _config_logger.warning("MONGO_URI is not set. MongoDB features will be unavailable.")

if not settings.effective_groq_key:
    _config_logger.warning("GROQ_API_KEY / GROK_API_KEY is not set. AI features will be disabled.")

if not settings.PINECONE_API_KEY:
    _config_logger.warning("PINECONE_API_KEY is not set. Vector search (RAG) will be disabled.")

if not settings.REDIS_ENABLED:
    _config_logger.info("Redis caching is disabled (REDIS_ENABLED=false). Using no-op cache.")
