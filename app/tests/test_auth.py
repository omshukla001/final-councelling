from unittest.mock import patch
import pytest

def test_missing_auth_header_blocked(client):
    """Ensure that endpoints secured with get_current_user reject requests without Bearer tokens."""
    # Attempting to access secure payment endpoint without headers
    response = client.post("/api/v1/payments/create-order", json={"firebase_uid": "spoofed_id", "amount": 9900})
    
    assert response.status_code == 401
    assert "Missing authentication token" in response.json()["detail"]

def test_invalid_auth_header_blocked(client):
    """Ensure that fake or malformed Bearer tokens are violently rejected."""
    response = client.post(
        "/api/v1/payments/create-order", 
        json={"firebase_uid": "spoofed_id", "amount": 9900},
        headers={"Authorization": "Bearer fake_token_123"}
    )
    
    assert response.status_code == 401
    assert "Invalid or expired" in response.json()["detail"]

@patch("app.core.auth.auth.verify_id_token")
def test_valid_auth_header_accepted(mock_verify_token, client, mock_db):
    """Ensure that cryptographically valid JWTs are accepted and processed correctly."""
    # Mocking the Firebase Admin verification to return a simulated decoded token
    mock_verify_token.return_value = {"uid": "true_secure_uid", "email": "test@example.com"}
    
    # We also need to mock Razorpay client to not actually hit razorpay
    with patch("app.api.v1.payments.rzp_client") as mock_rzp:
        mock_rzp.order.create.return_value = {"id": "order_mocked_123"}
        
        response = client.post(
            "/api/v1/payments/create-order", 
            json={"firebase_uid": "spoofed_id", "amount": 9900},
            headers={"Authorization": "Bearer valid_signed_token"}
        )
        
        assert response.status_code == 200
        assert mock_verify_token.called
        
        # Verify the database explicitly stored the order against the TRUE uid from the token, not the spoofed body
        user_record = mock_db["users"].find_one({"firebase_uid": "true_secure_uid"})
        assert user_record is not None
        assert user_record["pending_razorpay_order_id"] == "order_mocked_123"
