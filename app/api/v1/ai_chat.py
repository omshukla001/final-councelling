"""
AI Chat endpoint — uses the merged RAG pipeline.
"""
import time
import logging

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional

from app.services.rag_pipeline import retrieve_context, generate_answer
from app.db.mongo import get_mongo_db

logger = logging.getLogger("ai_chat")

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    firebase_uid: Optional[str] = None
    question: str = Field(..., min_length=3, max_length=1000)
    chat_history: list[ChatMessage] = Field(default_factory=list)
    counselling_type: str = Field(default="JOSAA")
    exam_type: str = Field(default="JEE Main")


class ChatResponse(BaseModel):
    question: str
    answer: str
    latency_ms: float
    options: list[str] = Field(default_factory=list)


@router.get("/health")
async def health():
    return {"status": "ok", "service": "ai-chat"}


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    db = Depends(get_mongo_db),
):
    """
    RAG-powered chat: embed question → retrieve from Pinecone → generate via Groq.
    Public endpoint — no auth required and no freemium message limits.
    """
    question = payload.question.strip()
    logger.info("Received question: %r", question)

    t0 = time.perf_counter()

    try:
        history = [{"role": m.role, "content": m.content} for m in payload.chat_history]
        context = retrieve_context(question, history, payload.counselling_type, payload.exam_type)
        answer, options = generate_answer(question, context, history, payload.counselling_type, payload.exam_type)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        exc_str = str(exc)
        logger.error("RAG pipeline error: %s", exc, exc_info=True)

        if "429" in exc_str or "RateLimitError" in type(exc).__name__:
            raise HTTPException(status_code=429, detail="Groq API rate limit. Try again shortly.") from exc
        if "401" in exc_str or "AuthenticationError" in type(exc).__name__:
            raise HTTPException(status_code=401, detail="Groq API key is invalid. Update GROK_API_KEY in .env.") from exc

        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {exc_str[:200]}") from exc

    latency_ms = (time.perf_counter() - t0) * 1000

    return ChatResponse(
        question=question,
        answer=answer,
        latency_ms=round(latency_ms, 1),
        options=options,
    )
