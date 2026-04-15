"""
Shared utility helpers used across backend services.
"""
import re
from typing import Optional, Dict, Any


def safe_int(value) -> int:
    """Safely convert a value to int, handling strings, floats, and edge cases.
    
    Examples:
        >>> safe_int(42)
        42
        >>> safe_int("123")
        123
        >>> safe_int(3.14)
        3
        >>> safe_int("99.5")
        99
        >>> safe_int(None)
        0
        >>> safe_int("not-a-number")
        0
    """
    if value is None:
        return 0
    try:
        return int(float(str(value).strip()))
    except (ValueError, TypeError):
        return 0


def extract_college_type(name: str) -> str:
    """Determine college type (IIT/NIT/IIIT/GFTI) from its name.
    
    Note: IIT check must exclude IIIT (Indian Institute of Information Technology).
    """
    if not name:
        return "GFTI"
    n = name.lower()
    # IIT but NOT IIIT
    if ("indian institute of technology" in n and "information" not in n) or n.startswith("iit "):
        return "IIT"
    if "national institute of technology" in n or " nit " in n or n.startswith("nit "):
        return "NIT"
    if "indian institute of information technology" in n or "iiit" in n:
        return "IIIT"
    return "GFTI"


def is_ism_dhanbad(name: str) -> bool:
    """Check if the name is the outdated 'Indian School of Mines Dhanbad' duplicate."""
    return "indian school of mines" in name.lower() if name else False
