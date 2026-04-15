import json
from typing import Optional, Dict, Any, List
from app.config import settings
from app.utils.logger import logger
from app.db.mongo import get_mongo_db

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

def query_mongodb_for_cutoffs(rank: int, exam_type: str, filters: Dict[str, Any], limit: int = 15) -> str:
    """
    Executes a direct MongoDB query to find colleges where the closing rank is >= the user's rank.
    """
    db = get_mongo_db()
    
    # Base query
    query = {}
    
    # 1. Exam Type Filter
    if exam_type == "JEE Advanced":
        query["institute_type"] = "IIT"
    elif exam_type == "JEE Main":
        query["institute_type"] = {"$in": ["NIT", "IIIT", "GFTI"]}
        
    # 2. Extract hints
    college_hint = filters.get("college_name_hint")
    if college_hint:
        query["institute"] = {"$regex": college_hint, "$options": "i"}
        
    branch_hint = filters.get("branch_hint")
    if branch_hint:
        query["academic_program_name"] = {"$regex": branch_hint, "$options": "i"}
        
    # We want latest year data, usually 2024 or 2025
    query["year"] = {"$in": [2024, 2025]}
    
    # We only want Round 6 (final assignments usually) to give accurate safe bounds
    query["round"] = 6
    
    # We only want OPEN gender-neutral for the initial broad sweep if not specified 
    # (We will refine this when we have full user state)
    query["seat_type"] = "OPEN"
    query["gender"] = "Gender-Neutral"

    # Fetch aggressive amount from DB, then sort in python to avoid complex index missing issues
    cursor = db.historical_cutoffs.find(query).limit(500)
    results = list(cursor)
    
    if not results:
        return "No exact cutoff matches found in the database. Please try broadening your search."
        
    # Filter mathematically: We want colleges where closing_rank is near or reasonably above the user's rank.
    # If user rank is 5000, a closing rank of 6000 is SAFE. 
    # A closing rank of 4500 is MODERATE/DREAM.
    # A closing rank of 100 is impossible.
    
    valid_options = []
    for r in results:
        close_idx = r.get("closing_rank")
        if isinstance(close_idx, (int, float)):
            # Keep options where closing rank is > user_rank * 0.8 (dreams) to user_rank * 3 (very safe)
            if (rank * 0.7) <= close_idx <= (rank * 5):
                valid_options.append(r)
                
    # Sort by how close they are to the user's rank
    valid_options.sort(key=lambda x: abs(x["closing_rank"] - rank))
    
    top_options = valid_options[:limit]
    
    if not top_options:
        return f"No realistic matches found for rank {rank} based on strict mathematical filtering."
        
    # Format for the LLM context
    context_lines = [f"EXACT DATABASE MATCHES FOR RANK {rank}:"]
    for opt in top_options:
        line = f"- {opt['institute']} | {opt['academic_program_name']} | Quota: {opt['quota']} | Close: {opt['closing_rank']} (Year: {opt['year']})"
        context_lines.append(line)
        
    return "\n".join(context_lines)
