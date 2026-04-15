"""
Rank Service API endpoints.

Provides FastAPI routes for percentile-to-rank conversion.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict
from app.services.rank_service import RankService

router = APIRouter(tags=["Rank Service"])


class RankPredictionRequest(BaseModel):
    """Request model for rank prediction."""
    percentile: float = Field(..., ge=0.0, le=100.0, description="Percentile score (0.0 to 100.0)")
    total_candidates: int = Field(..., gt=0, description="Total number of candidates")


class RankPredictionResponse(BaseModel):
    """Response model for rank prediction."""
    rank_low: int = Field(..., description="Lower bound of predicted rank")
    rank_high: int = Field(..., description="Upper bound of predicted rank")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level (0.0 to 1.0)")


@router.post("/predict", response_model=RankPredictionResponse)
async def predict_rank_from_percentile(request: RankPredictionRequest) -> RankPredictionResponse:
    """
    Predict rank from percentile using regression-style mapping.
    
    Args:
        request: RankPredictionRequest with percentile and total_candidates
        
    Returns:
        RankPredictionResponse with rank_low, rank_high, and confidence
        
    Raises:
        HTTPException: If inputs are invalid
        
    Example:
        Request:
        ```json
        {
            "percentile": 95.5,
            "total_candidates": 1000000
        }
        ```
        
        Response:
        ```json
        {
            "rank_low": 42000,
            "rank_high": 48000,
            "confidence": 0.85
        }
        ```
    """
    try:
        result = RankService.predict_rank(
            percentile=request.percentile,
            total_candidates=request.total_candidates
        )
        
        return RankPredictionResponse(
            rank_low=result["rank_low"],
            rank_high=result["rank_high"],
            confidence=result["confidence"]
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/predict", response_model=RankPredictionResponse)
async def predict_rank_get(
    percentile: float = Query(..., ge=0.0, le=100.0, description="Percentile score (0.0 to 100.0)"),
    total_candidates: int = Query(..., gt=0, description="Total number of candidates")
) -> RankPredictionResponse:
    """
    Predict rank from percentile (GET endpoint).
    
    Args:
        percentile: Percentile score (0.0 to 100.0)
        total_candidates: Total number of candidates
        
    Returns:
        RankPredictionResponse with rank_low, rank_high, and confidence
        
    Example:
        GET /api/v1/rank-service/predict?percentile=95.5&total_candidates=1000000
    """
    try:
        result = RankService.predict_rank(
            percentile=percentile,
            total_candidates=total_candidates
        )
        
        return RankPredictionResponse(
            rank_low=result["rank_low"],
            rank_high=result["rank_high"],
            confidence=result["confidence"]
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "rank_service"}
