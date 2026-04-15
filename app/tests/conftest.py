import pytest
import mongomock
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.db.mongo import get_mongo_db

@pytest.fixture(scope="module")
def mock_db():
    client = mongomock.MongoClient()
    return client["test_db"]

@pytest.fixture(scope="module")
def client(mock_db):
    # Override the MongoDB dependency to use the pure RAM mock
    def override_get_mongo():
        yield mock_db
    
    with patch("app.core.rate_limiter.redis_client", new=None):
        app.dependency_overrides[get_mongo_db] = override_get_mongo
        with TestClient(app) as test_client:
            yield test_client
        app.dependency_overrides.clear()
