"""
Unified constants for category & quota normalization.

Single source of truth — imported by all services & routes.
"""

# ── Category normalization ──────────────────────────────────────────────────────
# Maps user-facing / legacy DB values → canonical DB value
CATEGORY_NORMALIZATION: dict[str, str] = {
    "GEN": "OPEN",
    "GENERAL": "OPEN",
    "OPEN": "OPEN",
    "OPEN ": "OPEN",
    "OBC": "OBC-NCL",
    "OBC-NCL": "OBC-NCL",
    "SC": "SC",
    "ST": "ST",
    "EWS": "EWS",
    "OPEN (PWD)": "OPEN (PwD)",
}

VALID_CATEGORIES = ["OPEN", "EWS", "OBC-NCL", "SC", "ST", "OPEN (PwD)"]


# ── Quota normalization ─────────────────────────────────────────────────────────
# Maps verbose DB values → canonical abbreviation
QUOTA_NORMALIZATION: dict[str, str] = {
    "all india": "AI",
    "ai": "AI",
    "home state": "HS",
    "home state for goa": "HS",
    "hs": "HS",
    "other state": "OS",
    "os": "OS",
    "goa": "GO",
    "go": "GO",
    "jammu & kashmir (ut)": "JK",
    "jammu & kashmir": "JK",
    "jk": "JK",
    "ladakh (ut)": "LA",
    "ladakh": "LA",
    "la": "LA",
}

VALID_QUOTAS = ["AI", "HS", "OS", "GO", "JK", "LA"]

# ── Quota un-normalization (canonical → all DB variants) ─────────────────────
# Used when querying MongoDB which may store verbose values
QUOTA_UNNORMALIZATION: dict[str, list[str]] = {
    "AI": ["AI", "ALL INDIA"],
    "HS": ["HS", "HOME STATE", "HOME STATE FOR GOA"],
    "OS": ["OS", "OTHER STATE"],
    "GO": ["GO", "GOA"],
    "JK": ["JK", "JAMMU & KASHMIR (UT)", "JAMMU & KASHMIR"],
    "LA": ["LA", "LADAKH (UT)", "LADAKH"],
}


def normalize_category(raw: str) -> str:
    """Normalize a category string to its canonical form."""
    return CATEGORY_NORMALIZATION.get(raw.strip().upper(), raw.strip().upper())


def normalize_quota(raw: str) -> str:
    """Normalize a quota string to its canonical abbreviation."""
    return QUOTA_NORMALIZATION.get(raw.strip().lower(), raw.strip().upper())
