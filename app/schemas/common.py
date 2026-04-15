"""
Common schemas and utilities.
"""
from pydantic import BaseModel
from typing import Optional


class MessageResponse(BaseModel):
    """Standard message response."""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
