from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import hmac
import hashlib
import razorpay
from datetime import datetime, timedelta
import logging

from app.config import settings
from app.db.mongo import get_mongo_db
from app.core.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Payments"])

# Initialize Razorpay Client
if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
    rzp_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
else:
    rzp_client = None

# --- Schemas ---
class CreateOrderRequest(BaseModel):
    firebase_uid: str
    amount: int = 9900  # Amount in paise (99 INR)

class VerifyPaymentRequest(BaseModel):
    firebase_uid: str
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

class UserSyncRequest(BaseModel):
    firebase_uid: str
    email: str
    name: Optional[str] = "User"

# --- Endpoints ---

@router.post("/payments/create-order")
async def create_order(
    req: CreateOrderRequest, 
    db = Depends(get_mongo_db),
    user_token: dict = Depends(get_current_user)
):
    if not rzp_client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured.")
    
    # Enforce token identity overrides body payloads
    actual_uid = user_token["uid"]
    
    try:
        data = {
            "amount": req.amount,
            "currency": "INR",
            "receipt": actual_uid,
            "notes": {
                "firebase_uid": actual_uid
            }
        }
        order = rzp_client.order.create(data=data)
        
        # Fix: Bind this pending order to the user to prevent replay attacks
        users_collection = db["users"]
        users_collection.update_one(
            {"firebase_uid": actual_uid},
            {"$set": {"pending_razorpay_order_id": order["id"]}},
            upsert=True
        )
        
        return order
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payments/verify")
async def verify_payment(
    req: VerifyPaymentRequest, 
    db = Depends(get_mongo_db),
    user_token: dict = Depends(get_current_user)
):
    if not rzp_client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured.")
        
    actual_uid = user_token["uid"]
        
    try:
        # Verify the payment signature
        params_dict = {
            'razorpay_order_id': req.razorpay_order_id,
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_signature': req.razorpay_signature
        }
        
        users_collection = db["users"]
        
        # CRITICAL FIX: Identity Verification
        # Check that this exact order was originally requested by THIS exact authenticated user
        user = users_collection.find_one({"firebase_uid": actual_uid})
        if not user or user.get("pending_razorpay_order_id") != req.razorpay_order_id:
            logger.error("Replay attack or ownership mismatch detected for user %s", actual_uid)
            raise HTTPException(status_code=400, detail="Order ownership verification failed. Potential Replay attack blocked.")

        # Verify signature throws SignatureVerificationError on failure
        rzp_client.utility.verify_payment_signature(params_dict)
        
        # Payment is valid, update user in DB
        premium_until = datetime.utcnow() + timedelta(days=30)
        
        users_collection = db["users"]
        
        # Upsert user record
        result = users_collection.update_one(
            {"firebase_uid": actual_uid},
            {
                "$set": {
                    "is_premium": True,
                    "premium_until": premium_until,
                    "updated_at": datetime.utcnow(),
                    "pending_razorpay_order_id": None # Clear binding after successful payment
                },
                "$push": {
                    "payment_history": {
                        "payment_id": req.razorpay_payment_id,
                        "order_id": req.razorpay_order_id,
                        "amount_paise": 9900,
                        "timestamp": datetime.utcnow()
                    }
                }
            },
            upsert=True
        )
        
        return {"success": True, "premium_until": premium_until}
        
    except razorpay.errors.SignatureVerificationError:
        logger.error("Razorpay signature verification failed")
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payments/webhooks/razorpay")
async def razorpay_webhook(request: Request, db = Depends(get_mongo_db)):
    """Async Webhook fulfillment to guarantee premium activation on payment.captured."""
    if not rzp_client or not settings.RAZORPAY_WEBHOOK_SECRET:
        return {"status": "ignored", "detail": "Razorpay or webhook secret not configured"}

    payload_body = await request.body()
    signature = request.headers.get("x-razorpay-signature")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    try:
        # Verify the webhook signature intrinsically via the SDK
        rzp_client.utility.verify_webhook_signature(
            payload_body.decode('utf-8'),
            signature,
            settings.RAZORPAY_WEBHOOK_SECRET
        )
    except razorpay.errors.SignatureVerificationError:
        logger.error("Webhook signature verification failed")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        # Expected to be valid JSON if signature matches
        event_data = await request.json()
        event_name = event_data.get("event")

        if event_name == "payment.captured":
            payment_entity = event_data["payload"]["payment"]["entity"]
            firebase_uid = payment_entity.get("notes", {}).get("firebase_uid")
            
            if firebase_uid:
                premium_until = datetime.utcnow() + timedelta(days=30)
                users_collection = db["users"]
                users_collection.update_one(
                    {"firebase_uid": firebase_uid},
                    {
                        "$set": {
                            "is_premium": True,
                            "premium_until": premium_until,
                            "updated_at": datetime.utcnow(),
                            "pending_razorpay_order_id": None
                        },
                        "$push": {
                            "payment_history": {
                                "payment_id": payment_entity.get("id"),
                                "order_id": payment_entity.get("order_id"),
                                "amount_paise": payment_entity.get("amount"),
                                "timestamp": datetime.utcnow(),
                                "source": "webhook"
                            }
                        }
                    },
                    upsert=True
                )
                logger.info(f"Webhook securely fulfilled Premium for user: {firebase_uid}")
                
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        # Return 200 occasionally so razorpay doesn't spam retry, or 500 depending on strategy
        # Here we raise 500 to invoke razorpay retry
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@router.post("/user/sync")
async def sync_user(
    req: UserSyncRequest, 
    db = Depends(get_mongo_db),
    user_token: dict = Depends(get_current_user)
):
    """Syncs basic Firebase user data to MongoDB to ensure a record exists."""
    users_collection = db["users"]
    
    # Overwrite payload with cryptographic truth
    actual_uid = user_token["uid"]
    actual_email = user_token.get("email", req.email)
    
    # Check if exists
    existing = users_collection.find_one({"firebase_uid": actual_uid})
    if not existing:
        users_collection.insert_one({
            "firebase_uid": actual_uid,
            "email": actual_email,
            "name": req.name,
            "is_premium": False,
            "premium_until": None,
            "ai_message_count": 0,
            "created_at": datetime.utcnow(),
            "payment_history": []
        })
        return {"is_premium": False, "ai_message_count": 0}
        
    # Valid premium check
    is_premium = existing.get("is_premium", False)
    if is_premium and existing.get("premium_until"):
        # Check expiry
        if datetime.utcnow() > existing.get("premium_until"):
            is_premium = False
            users_collection.update_one({"_id": existing["_id"]}, {"$set": {"is_premium": False}})
            
    return {
        "is_premium": is_premium,
        "ai_message_count": existing.get("ai_message_count", 0),
        "premium_until": existing.get("premium_until")
    }



