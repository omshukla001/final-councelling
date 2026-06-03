"""
Firebase Authentication Dependency.
Verifies JWT tokens presented in the Authorization header.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth
import base64
import json
import os
import logging
from app.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


def _load_firebase_credentials() -> credentials.Base | None:
    """
    Resolve Firebase Admin credentials in this priority order:
      1. FIREBASE_CREDENTIALS_BASE64  (base64 of service-account JSON — recommended for EC2/CI)
      2. FIREBASE_CREDENTIALS_JSON    (raw JSON string)
      3. FIREBASE_CREDENTIALS_PATH    (path to a mounted JSON secret)
      4. GOOGLE_APPLICATION_CREDENTIALS (Google-standard env var, path)
      5. Legacy file next to run.py   (dev-only convenience)
    """
    # 1. Base64-encoded JSON
    if settings.FIREBASE_CREDENTIALS_BASE64:
        try:
            decoded = base64.b64decode(settings.FIREBASE_CREDENTIALS_BASE64).decode("utf-8")
            return credentials.Certificate(json.loads(decoded))
        except Exception as e:
            logger.error(f"FIREBASE_CREDENTIALS_BASE64 failed to decode: {e}")

    # 2. Raw JSON
    if settings.FIREBASE_CREDENTIALS_JSON:
        try:
            return credentials.Certificate(json.loads(settings.FIREBASE_CREDENTIALS_JSON))
        except Exception as e:
            logger.error(f"FIREBASE_CREDENTIALS_JSON failed to parse: {e}")

    # 3 & 4. Filesystem paths
    for candidate in (settings.FIREBASE_CREDENTIALS_PATH, os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")):
        if candidate and os.path.exists(candidate):
            return credentials.Certificate(candidate)

    # 5. Legacy file next to run.py — dev convenience only
    legacy = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "counsellor-wala-production-firebase-adminsdk-fbsvc-080887fa8b.json",
    )
    if os.path.exists(legacy):
        if not settings.DEBUG:
            logger.warning(
                "Loading Firebase credentials from legacy on-disk file. "
                "In production, use FIREBASE_CREDENTIALS_BASE64 or FIREBASE_CREDENTIALS_PATH instead."
            )
        return credentials.Certificate(legacy)

    return None


# Initialize Firebase Admin exactly once
try:
    cred = _load_firebase_credentials()
    if cred is not None:
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized.")
    else:
        msg = (
            "Firebase credentials not found. Set FIREBASE_CREDENTIALS_BASE64 "
            "(or _JSON / _PATH) in the environment."
        )
        if settings.DEBUG:
            logger.warning(msg + " — continuing in DEBUG mode, auth endpoints will reject requests.")
        else:
            # Hard fail at startup in production — silent auth is worse than a crash
            raise RuntimeError(msg)
except ValueError:
    # initialize_app already called — safe to ignore
    pass
except RuntimeError:
    raise
except Exception as e:
    logger.error(f"Failed to initialize Firebase Admin SDK: {e}")

async def get_current_user(cred: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Validates the Bearer token and returns the decoded Firebase user dictionary.
    Raises 401 if missing or invalid.
    """
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token. Bearer token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        decoded_token = auth.verify_id_token(cred.credentials)
        return decoded_token
    except Exception as e:
        logger.warning(f"Invalid authentication token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_user(cred: HTTPAuthorizationCredentials = Depends(security)) -> dict | None:
    """
    Validates the Bearer token if present, returns None if missing or invalid.
    """
    if not cred:
        return None
        
    try:
        decoded_token = auth.verify_id_token(cred.credentials)
        return decoded_token
    except Exception:
        return None
