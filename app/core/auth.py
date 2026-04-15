"""
Firebase Authentication Dependency.
Verifies JWT tokens presented in the Authorization header.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth
import os
import logging
from app.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

# Initialize Firebase Admin
try:
    cred_path = r"D:\councler-2.0-main\counsellor-wala-production-firebase-adminsdk-fbsvc-080887fa8b.json"
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully.")
    else:
        logger.error(f"Firebase Service Account Key not found at {cred_path}")
except ValueError:
    # Already initialized
    pass
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
