from unittest.mock import patch, MagicMock
import pytest
from datetime import datetime

# We need to mock BOTH rzp_client AND settings.RAZORPAY_WEBHOOK_SECRET
# otherwise the endpoint short-circuits with {"status": "ignored"}.

WEBHOOK_PATCHES = [
    patch("app.api.v1.payments.rzp_client", new_callable=MagicMock),
    patch("app.api.v1.payments.settings", wraps=__import__("app.config", fromlist=["settings"]).settings),
]


def test_webhook_missing_signature(client):
    """Ensure webhooks without the Razorpay signature header are immediately dropped."""
    with patch("app.api.v1.payments.rzp_client", new_callable=MagicMock) as mock_rzp, \
         patch("app.api.v1.payments.settings") as mock_settings:
        mock_settings.RAZORPAY_WEBHOOK_SECRET = "test_secret"

        response = client.post(
            "/api/v1/payments/webhooks/razorpay",
            json={"event": "payment.captured"}
        )
    assert response.status_code == 400
    assert "Missing signature" in response.json()["detail"]


def test_webhook_invalid_signature(client):
    """Ensure invalid cryptographic signatures raise 400 Bad Request."""
    import razorpay

    with patch("app.api.v1.payments.rzp_client") as mock_rzp, \
         patch("app.api.v1.payments.settings") as mock_settings:
        mock_settings.RAZORPAY_WEBHOOK_SECRET = "test_secret"
        mock_rzp.utility.verify_webhook_signature.side_effect = razorpay.errors.SignatureVerificationError("Invalid")

        response = client.post(
            "/api/v1/payments/webhooks/razorpay",
            json={"event": "payment.captured"},
            headers={"x-razorpay-signature": "bad_signature_123"}
        )

    assert response.status_code == 400
    assert "Invalid webhook signature" in response.json()["detail"]


def test_webhook_valid_fulfillment(client, mock_db):
    """Simulate a valid Webhook from Razorpay successfully fulfilling a premium subscription."""
    with patch("app.api.v1.payments.rzp_client") as mock_rzp, \
         patch("app.api.v1.payments.settings") as mock_settings:
        mock_settings.RAZORPAY_WEBHOOK_SECRET = "test_secret"
        mock_rzp.utility.verify_webhook_signature.return_value = True

        valid_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_xyz",
                        "order_id": "order_xyz",
                        "amount": 9900,
                        "notes": {
                            "firebase_uid": "test_async_user"
                        }
                    }
                }
            }
        }

        # Insert a dummy user who is Free tier
        users_col = mock_db["users"]
        users_col.delete_many({"firebase_uid": "test_async_user"})  # clean slate
        users_col.insert_one({"firebase_uid": "test_async_user", "is_premium": False})

        response = client.post(
            "/api/v1/payments/webhooks/razorpay",
            json=valid_payload,
            headers={"x-razorpay-signature": "perfect_signature"}
        )

    assert response.status_code == 200
    assert response.json()["status"] == "ok"

    # Verify the database updated independently of the frontend
    updated_user = users_col.find_one({"firebase_uid": "test_async_user"})
    assert updated_user["is_premium"] is True
    assert updated_user["pending_razorpay_order_id"] is None
    assert len(updated_user["payment_history"]) == 1
    assert updated_user["payment_history"][0]["source"] == "webhook"
