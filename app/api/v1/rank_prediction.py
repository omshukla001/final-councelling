"""
Rank prediction API routes.

Uses the unified RankService for percentile-to-rank conversion
and RankPredictionService for category-aware prediction with AI explanations.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.schemas.recommendation import RankPredictionRequest, RankPredictionResponse
from app.services.rank_service import RankService
from app.services.quota_filtering import QuotaFilteringService
from app.utils.ai_client import ai_client
from app.utils.cache import CacheService, CacheKeys
from app.config import settings
from app.utils.logger import logger

router = APIRouter(prefix="/rank-prediction", tags=["Rank Prediction"])

from app.db.mongo import get_mongo_db

@router.post("/predict", response_model=RankPredictionResponse)
async def predict_rank(
    request: RankPredictionRequest,
):
    """
    Predict rank range and confidence interval. Public endpoint — no auth or usage limits.
    """
    # Validate category and quota
    if not QuotaFilteringService.validate_category(request.category):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {QuotaFilteringService.VALID_CATEGORIES}"
        )
    
    if not QuotaFilteringService.validate_quota(request.quota):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid quota. Must be one of: {QuotaFilteringService.VALID_QUOTAS}"
        )
    
    # Public access — fixed guest identity for caching
    actual_uid = "guest"

    # Check cache
    cache_key = CacheKeys.rank_prediction(actual_uid, request.jee_rank, request.category)
    cached = CacheService.get(cache_key)
    if cached:
        return RankPredictionResponse(**cached)
    
    # Get rank range using QuotaFilteringService
    rank_range = QuotaFilteringService.get_rank_range_for_category_quota(
        db=None,
        category=request.category,
        quota=request.quota
    )
    
    # Prediction basics
    predicted_rank = request.jee_rank
    confidence_margin = int(request.jee_rank * 0.10)
    confidence_range = {
        "min": max(1, request.jee_rank - confidence_margin),
        "max": request.jee_rank + confidence_margin
    }
        
    # Generate AI explanation
    try:
        prompt = f"Explain the JEE rank prediction for rank {request.jee_rank} in category {request.category} with quota {request.quota}."
        context = {
            "jee_rank": request.jee_rank,
            "category": request.category,
            "quota": request.quota,
            "predicted_rank": predicted_rank,
            "confidence_range": confidence_range
        }
        explanation = await ai_client.generate_explanation(prompt, context)
    except Exception as e:
        logger.error(f"Error generating explanation: {e}")
        explanation = f"Based on your rank {request.jee_rank} in {request.category} category with {request.quota} quota, you have a competitive position for admissions."
    
    result = RankPredictionResponse(
        predicted_rank=predicted_rank,
        confidence_range=confidence_range,
        explanation=explanation
    )
    
    # Cache result
    if cache_key:
        CacheService.set(cache_key, result.model_dump(), ttl=settings.CACHE_TTL_RANK_PREDICTION)
    
    return result
