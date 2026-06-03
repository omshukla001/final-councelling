"""
RAG pipeline — merged from ai chat bot/backend/rag_pipeline.py.
Uses Groq (OpenAI-compatible) + Pinecone + local embeddings.
"""
import os
import re
import json
from typing import Optional, List

from openai import OpenAI
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer  # noqa: F401 — also lazy-loaded in _get_embed_model
from app.config import settings
from app.utils.logger import logger

# ── Groq client (OpenAI-compatible) ───────────────────────────────────────────
_grok_client: Optional[OpenAI] = None


def _get_groq_client() -> OpenAI:
    global _grok_client
    if _grok_client is None:
        api_key = settings.effective_groq_key
        if not api_key:
            raise EnvironmentError("GROQ_API_KEY not set in .env")
        _grok_client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
    return _grok_client


# ── Constants (from centralized config) ────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COLLECTION_NAME = "colleges"
LOCAL_EMBED_MODEL = settings.EMBEDDING_MODEL
GENERATION_MODEL = settings.GENERATION_MODEL
TOP_K = settings.AI_TOP_K

# ── Lazy-loaded embedding model (avoids 2-3s cold-start penalty) ──────────────
_embed_model = None

def _get_embed_model():
    """Load SentenceTransformer on first use, not at import time."""
    global _embed_model
    if _embed_model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading SentenceTransformer embedding model...")
        _embed_model = SentenceTransformer(LOCAL_EMBED_MODEL)
        logger.info("Embedding model loaded.")
    return _embed_model




# ── Pinecone ──────────────────────────────────────────────────────────────────
_pinecone_index = None

def _get_pinecone_index():
    global _pinecone_index
    if _pinecone_index is None:
        api_key = settings.PINECONE_API_KEY
        index_name = settings.PINECONE_INDEX_NAME or "colleges"
        if not api_key:
            raise EnvironmentError("PINECONE_API_KEY not set in .env")
        pc = Pinecone(api_key=api_key)
        _pinecone_index = pc.Index(index_name)
    return _pinecone_index


from app.services.agentic_router import route_query, query_mongodb_for_cutoffs

def _extract_rank(question: str, chat_history: list = None) -> Optional[int]:
    match = re.search(r"\b(\d{3,6})\b", question)
    if match:
        return int(match.group(1))
    if chat_history:
        for msg in reversed(chat_history):
            content = msg.get("content", "")
            match = re.search(r"\b(\d{3,6})\b", content)
            if match:
                return int(match.group(1))
    return None


def retrieve_context(question: str, chat_history: list = None, counselling_type: str = "JOSAA", exam_type: str = "JEE Main") -> str:
    rank = _extract_rank(question, chat_history)

    # Agentic Routing
    logger.info(f"Routing query with rank: {rank}")
    decision = route_query(question, rank, exam_type, counselling_type)
    route = decision.get("route", "vector")
    logger.info(f"Router decision: {route}")
    
    # If it's a hard numeric query AND we know their rank, go directly to MongoDB
    if route == "database" and rank is not None:
        filters = decision.get("extracted_filters", {})
        db_context = query_mongodb_for_cutoffs(rank, exam_type, filters)
        if db_context and "No real" not in db_context:
            return db_context

    # Fallback to Vector Search — gracefully degrade if Pinecone is down / key invalid
    exam_context = "IIT Indian Institute of Technology" if exam_type == "JEE Advanced" else "NIT National Institute IIIT Indian Institute of Information Technology GFTI"
    augmented_query = f"{question} {exam_context} {counselling_type}"

    try:
        index = _get_pinecone_index()
        query_embedding = _get_embed_model().encode(augmented_query).tolist()
        results = index.query(
            vector=query_embedding,
            top_k=40,
            include_metadata=True
        )
    except Exception as e:
        # Don't crash the whole chat request if Pinecone is unreachable / unauthorized.
        # Return a neutral context so the LLM can still answer with a graceful deflection.
        logger.error(f"Pinecone vector search unavailable: {type(e).__name__}: {e}")
        return (
            "Vector knowledge base is temporarily unavailable. "
            "Answer based on general JoSAA counselling knowledge and ask the user for their rank "
            "if needed; do NOT invent specific cutoff numbers."
        )

    matches = results.get("matches", [])
    if not matches:
        return "No relevant college information found in the database."

    filtered_docs = []
    for m in matches:
        metadata = m.get("metadata", {})
        name = metadata.get("name", "")
        text = metadata.get("text", "")
        
        is_iit = name.startswith("Indian Institute of Technology") or name.startswith("IIT ")
        
        if exam_type == "JEE Advanced" and not is_iit: continue
        if exam_type != "JEE Advanced" and is_iit: continue
            
        filtered_docs.append(text)
        if len(filtered_docs) >= TOP_K:
            break

    if not filtered_docs:
        return f"No relevant {'IIT' if exam_type == 'JEE Advanced' else 'NIT/IIIT/GFTI'} colleges found matching your query."

    context_blocks = "\n\n---\n\n".join(d[:2500] for d in filtered_docs)
    student_rank_note = f"[STUDENT RANK: {rank}]\n\n" if rank else ""
    return f"{student_rank_note}RELEVANT COLLEGE DATA:\n\n{context_blocks}"


def generate_answer(question: str, context: str, chat_history: list = None, counselling_type: str = "JOSAA", exam_type: str = "JEE Main") -> str:
    client = _get_groq_client()
    
    new_system_prompt = """You are an elite, highly enthusiastic JoSAA/CSAB College Counselling Mentor.
Your goal is to guide JEE students with mathematical precision while making the conversation engaging, encouraging, and visually stunning.

CRITICAL RULES:
1. STUDENT RANK IS SACRED. A lower numerical rank is BETTER (e.g., Rank 1 is the best). 
2. ELIGIBILITY LOGIC: If a student's rank number is HIGHER than the college's closing rank (e.g., Student Rank 1000, Closing Rank 100), the student CANNOT get admission. Only suggest colleges where Student's Rank <= Closing Rank. 
3. CHANCE ANALYSIS: 
   - SAFE: Student Rank is significantly lower than Closing Rank (e.g., Rank 5000 for a Closing Rank of 8000).
   - MODERATE: Student Rank is very close to Closing Rank.
   - IMPOSSIBLE: Student Rank is higher than Closing Rank. DO NOT suggest impossible colleges.
4. HALLUCINATION BAN: USE ONLY CONTEXT DATA provided below. If the context does not contain matching colleges, apologize and clearly state no colleges matched. NEVER invent cutoff numbers or universities.

FORMAT REQUIREMENT: You MUST output ONLY valid JSON. 
{
  "friendly_response": "Your detailed, engaging markdown formatted text here. Use markdown tables if outputting cutoff numbers! Use bolding and emojis! 🚀",
  "chart_data": [
      {"name": "IIT Bombay CSE", "closing_rank": 61},
      {"name": "IIT Delhi CSE", "closing_rank": 118}
  ],
  "magic_chips": [
    "Compare with ECE ⚡",
    "Show me safe NITs 🏛️",
    "What are the fees? 💰"
  ]
}

- `chart_data`: If the user asks for cutoffs or comparisons, extract up to 5 structured data points here so the Frontend can render a Bar Chart. If no numerical comparison makes sense, return an empty array [].
- `magic_chips`: Provide EXACTLY 3 highly personalized, specific follow-up questions based exclusively on the current conversation context and the exact colleges or rank discussed. NEVER use generic or boring options like "Predict My College" or "Show Cutoffs". Frame them like a natural conversation. Examples: "What are the fees at IIT Bombay? 💰", "Are there any lower-tier NITs where I can get CSE? 🏛️", "Compare ECE and Electrical at this college ⚡". ALWAYS include a relevant emoji.
"""

    messages = [{"role": "system", "content": new_system_prompt}]

    if chat_history:
        for msg in chat_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "assistant" and len(content) > 1000:
                content = content[:1000] + "\n...[truncated]"
            messages.append({"role": role, "content": content})

    strict_rules = f"""
1. COUNSELLING SYSTEM: {counselling_type}. EXAM TYPE: {exam_type}. 
   - If 'JEE Advanced', EXCLUDE ALL NITs/IIITs/GFTIs. ONLY output 'IIT'.
   - If 'JEE Main', EXCLUDE ALL IITs. ONLY output 'NIT', 'IIIT', or 'GFIT'.
2. MAGIC CHIPS CONTEXT: The options you generate MUST be highly personalized base on what the user wants to know and their inputs.
"""

    user_message = (
        f"{context}\n\n---\n\n"
        f"Student question: {question}\n\n"
        f"{strict_rules}\n"
    )
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model=GENERATION_MODEL,
        messages=messages,
        temperature=0.15,
        max_tokens=2500,
        response_format={"type": "json_object"}
    )
    
    try:
        data = json.loads(response.choices[0].message.content.strip())
        return data.get("friendly_response", "Error parsing answer."), data.get("options", data.get("magic_chips", []))
    except Exception as e:
        logger.error(f"Failed to parse JSON from AI: {e}")
        return response.choices[0].message.content.strip(), []
