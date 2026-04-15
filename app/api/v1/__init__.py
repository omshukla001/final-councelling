"""
API v1 routes aggregation.
"""
from fastapi import APIRouter
from app.api.v1 import (
    rank_service,
    rank_prediction,
    recommendation_service,
    ai_chat,
    counsellor,
    placement_data,
    payments,
)

api_router = APIRouter()

api_router.include_router(rank_service.router, prefix="/rank-service")
api_router.include_router(rank_prediction.router)
api_router.include_router(recommendation_service.router, prefix="/recommendation-service")
api_router.include_router(ai_chat.router)
api_router.include_router(counsellor.router, prefix="/counsellor")
api_router.include_router(placement_data.router, prefix="/placement-data")
api_router.include_router(payments.router)
