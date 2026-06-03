import json
import re
from typing import Optional, Dict, Any, List
from app.config import settings
from app.utils.logger import logger
from app.db.mongo import get_mongo_db


# ── Hint aliases ──────────────────────────────────────────────────────────────
# Users type "NIT Trichy" / "IIT Bombay" / "CSE" but the DB stores
# "National Institute of Technology, Tiruchirappalli" / "Computer Science and
# Engineering (4 Years, Bachelor of Technology)". Expand the short forms to
# token lists that the official name / branch string must all contain.

# College hint aliases — institute acronyms + common city nicknames.
_COLLEGE_ALIASES: Dict[str, List[str]] = {
    "iit":     ["indian", "institute", "technology"],
    "nit":     ["national", "institute", "technology"],
    "iiit":    ["indian", "institute", "information", "technology"],
    "svnit":   ["sardar", "vallabhbhai", "national", "surat"],
    "vnit":    ["visvesvaraya", "national", "nagpur"],
    "mnit":    ["malaviya", "national", "jaipur"],
    "mnnit":   ["motilal", "nehru", "national", "allahabad"],
    "manit":   ["maulana", "azad", "national", "bhopal"],
    "nitk":    ["national", "karnataka", "surathkal"],
    # Common city nicknames → city tokens as stored in official names.
    "trichy":     ["tiruchirappalli"],
    "tiruchy":    ["tiruchirappalli"],
    "bhu":        ["varanasi"],
    "mumbai":     ["bombay"],
    "kgp":        ["kharagpur"],
    "banaras":    ["varanasi"],
    "ism":        ["dhanbad"],
    "dhanbad":    ["dhanbad"],
}

# Branch hint aliases — expand short forms to tokens present in the DB's full
# branch descriptors. Order matters a little because callers may pass longer
# phrases that already contain these tokens; exact-match wins at the alias level.
_BRANCH_ALIASES: Dict[str, List[str]] = {
    "cse":          ["computer", "science"],
    "cs":           ["computer", "science"],
    "cs&e":         ["computer", "science"],
    "cse(ai)":      ["computer", "science", "artificial"],
    "ece":          ["electronics", "communication"],
    "ec":           ["electronics", "communication"],
    "ee":           ["electrical"],
    "eee":          ["electrical"],
    "mech":         ["mechanical"],
    "mechanical":   ["mechanical"],
    "civil":        ["civil"],
    "chem":         ["chemical"],
    "chemical":     ["chemical"],
    "aero":         ["aerospace"],
    "aerospace":    ["aerospace"],
    "it":           ["information", "technology"],
    "ai":           ["artificial", "intelligence"],
    "aiml":         ["artificial", "intelligence"],
    "ml":           ["machine", "learning"],
    "ds":           ["data", "science"],
    "mnc":          ["mathematics", "computing"],
    "maths":        ["mathematics"],
    "math":         ["mathematics"],
    "meta":         ["metallurgical"],
    "metallurgy":   ["metallurgical"],
    "bio":          ["biotechnology"],
    "biotech":      ["biotechnology"],
    "bsbe":         ["biosciences", "biomedical"],
    "instrumentation": ["instrumentation"],
    "production":   ["production"],
    "naval":        ["naval"],
    "ocean":        ["ocean"],
    "textile":      ["textile"],
    "mining":       ["mining"],
    "petroleum":    ["petroleum"],
    "automobile":   ["automobile"],
}


def _normalize_text(s: str) -> str:
    """Lowercase, collapse non-alphanumerics to single spaces, trim."""
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def _expand_tokens(hint: str, aliases: Dict[str, List[str]]) -> List[str]:
    """Tokenise `hint`, expand each token through `aliases`, return flat token list."""
    out: List[str] = []
    for tok in _normalize_text(hint).split():
        if tok in aliases:
            out.extend(aliases[tok])
        elif tok:
            out.append(tok)
    # De-duplicate while preserving order
    seen: set = set()
    unique: List[str] = []
    for t in out:
        if t not in seen:
            seen.add(t)
            unique.append(t)
    return unique


def _all_tokens_in(tokens: List[str], text: str) -> bool:
    """True iff every token appears as a whole word (case-insensitive) in text."""
    padded = " " + _normalize_text(text) + " "
    return all(f" {t} " in padded for t in tokens)

def _get_groq_client():
    from app.services.rag_pipeline import _get_groq_client as get_client
    return get_client()

def route_query(question: str, rank: Optional[int], exam_type: str, counselling_type: str) -> Dict[str, Any]:
    """
    Uses a fast LLM call to classify the intent of the user's question.
    Returns a routing decision: 'database' (needs exact numerical filtering) or 'vector' (general Q&A).
    """
    client = _get_groq_client()

    routing_prompt = f"""You are an intelligent query router for a JEE College Counselling application.
Your job is to read the user's question and decide if it requires EXACT mathematical filtering against a database, or semantic vector search for general answers.

User Question: "{question}"
User Rank (if known): {rank}
Exam Type: {exam_type}
Counselling: {counselling_type}

RULES:
1. If the user is asking FOR PREDICTIONS, "can I get", "which college", "what branch", or "chances" based on their rank -> Route to 'database'.
2. If the user is asking for SPECIFIC CUTOFFS for a specific college (e.g., "What was the cutoff for CSE at IIT Bombay?") -> Route to 'database'.
3. If the user is asking for general information, reviews, campus life, placement statistics, or "what is" -> Route to 'vector'.
4. If the user is asking a conversational follow-up ("what about ECE instead?") and we have a rank -> Route to 'database'.
5. If the user explicitly mentions their rank and questions about it (e.g. "my rank is 1000") -> Route to 'database'.


You must respond ONLY with this JSON schema:
{{
    "route": "database" | "vector",
    "extracted_filters": {{
        "college_name_hint": "extracted name or null",
        "branch_hint": "extracted branch or null"
    }}
}}
"""
    try:
        response = client.chat.completions.create(
            model=settings.GENERATION_MODEL,
            messages=[{"role": "user", "content": routing_prompt}],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        decision = json.loads(response.choices[0].message.content)
        return decision
    except Exception as e:
        logger.error(f"Routing failed, defaulting to vector: {e}")
        return {"route": "vector", "extracted_filters": {}}


# ── Cached type → college_id lookup (schema: historical_cutoffs uses college_id;
#    master_colleges holds institute type + display name). Cached once per process
#    because master_colleges has only ~134 rows and never changes at request-time.
_type_to_ids_cache: Optional[Dict[str, List[str]]] = None
_id_to_name_cache: Optional[Dict[str, str]] = None
_id_to_type_cache: Optional[Dict[str, str]] = None


def _ensure_college_caches() -> None:
    global _type_to_ids_cache, _id_to_name_cache, _id_to_type_cache
    if _type_to_ids_cache is not None:
        return
    db = get_mongo_db()
    t2ids: Dict[str, List[str]] = {}
    id2name: Dict[str, str] = {}
    id2type: Dict[str, str] = {}
    for doc in db.master_colleges.find({}, {"college_id": 1, "type": 1, "official_josaa_name": 1}):
        cid = doc.get("college_id")
        ctype = doc.get("type")
        cname = doc.get("official_josaa_name") or ""
        if not cid or not ctype:
            continue
        t2ids.setdefault(ctype, []).append(cid)
        id2name[cid] = cname
        id2type[cid] = ctype
    _type_to_ids_cache = t2ids
    _id_to_name_cache = id2name
    _id_to_type_cache = id2type
    logger.info(
        f"college caches built: types={ {k: len(v) for k, v in t2ids.items()} }"
    )


def _ids_for_exam(exam_type: str) -> List[str]:
    _ensure_college_caches()
    assert _type_to_ids_cache is not None
    if exam_type == "JEE Advanced":
        return list(_type_to_ids_cache.get("IIT", []))
    # JEE Main covers NIT / IIIT / GFTI
    ids: List[str] = []
    for t in ("NIT", "IIIT", "GFTI"):
        ids.extend(_type_to_ids_cache.get(t, []))
    return ids


def query_mongodb_for_cutoffs(rank: int, exam_type: str, filters: Dict[str, Any], limit: int = 15) -> str:
    """
    Finds colleges where the closing rank is reasonably near the user's rank.

    Schema note: historical_cutoffs has fields {college_id, year, round, branch,
    quota, category, gender, opening_rank, closing_rank}. The institute type
    (NIT / IIIT / GFTI / IIT) and human-readable name live in master_colleges.
    """
    db = get_mongo_db()
    _ensure_college_caches()
    assert _id_to_name_cache is not None and _id_to_type_cache is not None

    # 1. Exam-type filter → resolve to the college_id universe
    eligible_ids = set(_ids_for_exam(exam_type))

    # 2. Name hint → expand acronyms/aliases, then require all tokens in the
    #    official name. Falls back to broader set if nothing matches.
    college_hint = (filters or {}).get("college_name_hint")
    if college_hint:
        college_tokens = _expand_tokens(college_hint, _COLLEGE_ALIASES)
        if college_tokens:
            matched_ids = {
                cid for cid, name in _id_to_name_cache.items()
                if _all_tokens_in(college_tokens, name)
            }
            if matched_ids:
                eligible_ids &= matched_ids
                logger.info(
                    f"college hint {college_hint!r} → tokens {college_tokens} "
                    f"→ {len(matched_ids)} colleges"
                )
            else:
                logger.info(
                    f"college hint {college_hint!r} → tokens {college_tokens} "
                    f"matched 0 colleges; ignoring hint"
                )

    query: Dict[str, Any] = {
        "college_id": {"$in": list(eligible_ids)},
        "year": {"$in": [2024, 2025]},
        "round": 6,
        "category": "OPEN",
        "gender": "Gender-Neutral",
    }

    # 3. Branch hint → expand via alias table, then AND-regex the tokens
    #    against the full branch string.
    branch_hint = (filters or {}).get("branch_hint")
    if branch_hint:
        branch_tokens = _expand_tokens(branch_hint, _BRANCH_ALIASES)
        if branch_tokens:
            query["$and"] = [
                {"branch": {"$regex": re.escape(t), "$options": "i"}}
                for t in branch_tokens
            ]
            logger.info(f"branch hint {branch_hint!r} → tokens {branch_tokens}")

    # Grab a broad slice then filter/rank in Python (avoids requiring compound indexes).
    cursor = db.historical_cutoffs.find(query).limit(500)
    results = list(cursor)

    if not results:
        return "No exact cutoff matches found in the database. Please try broadening your search."

    # Keep options where closing_rank sits in a sensible window around the user's rank.
    # A lower numerical rank is better; a college is reachable iff student_rank <= closing_rank.
    # Window widens multiplicatively for top rankers (otherwise rank 1 has window [0.7, 5]
    # which excludes every real college).  Use an absolute floor of 50 below / 200 above.
    lo_bound = max(0, min(rank * 0.5, rank - 50))
    hi_bound = max(rank * 8, rank + 200)
    valid_options = []
    for r in results:
        close_idx = r.get("closing_rank")
        if isinstance(close_idx, (int, float)):
            if lo_bound <= close_idx <= hi_bound:
                valid_options.append(r)

    valid_options.sort(key=lambda x: abs(x["closing_rank"] - rank))
    top_options = valid_options[:limit]

    if not top_options:
        return f"No realistic matches found for rank {rank} based on strict mathematical filtering."

    context_lines = [f"EXACT DATABASE MATCHES FOR RANK {rank}:"]
    for opt in top_options:
        cid = opt.get("college_id", "")
        institute = _id_to_name_cache.get(cid, cid) or cid
        itype = _id_to_type_cache.get(cid, "")
        line = (
            f"- {institute} ({itype}) | {opt.get('branch', '')} "
            f"| Quota: {opt.get('quota', '')} | Close: {opt.get('closing_rank')} "
            f"(Year: {opt.get('year')})"
        )
        context_lines.append(line)

    return "\n".join(context_lines)
