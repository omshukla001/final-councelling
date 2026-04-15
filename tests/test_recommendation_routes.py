"""
Integration test for recommendation_service API routes.

Tests the full request → response cycle using FastAPI's TestClient.
Uses mocked MongoDB to avoid requiring a live database.
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


@pytest.fixture
def mock_mongo_db():
    """Create a mock MongoDB database with minimal test data."""
    mock_db = MagicMock()
    
    # Mock master_colleges collection
    mock_colleges = [
        {
            "college_id": "test-001",
            "official_josaa_name": "Indian Institute of Technology Bombay",
            "state": "Maharashtra",
            "type": "IIT",
            "nirf_engineering_rank": 3,
        },
        {
            "college_id": "test-002",
            "official_josaa_name": "National Institute of Technology Trichy",
            "state": "Tamil Nadu",
            "type": "NIT",
            "nirf_engineering_rank": 10,
        },
    ]
    mock_db.__getitem__.return_value.find.return_value = mock_colleges
    mock_db.__getitem__.return_value.find_one.return_value = mock_colleges[0]
    mock_db.__getitem__.return_value.distinct.return_value = ["OPEN", "OBC-NCL", "SC", "ST", "EWS"]
    
    return mock_db


@pytest.fixture
def client():
    """Create FastAPI TestClient with the recommendation router."""
    from fastapi import FastAPI
    from app.api.v1.recommendation_service import router
    
    app = FastAPI()
    app.include_router(router, prefix="/api/v1/recommendation-service")
    return TestClient(app)


class TestHealthEndpoint:
    """Test the health check endpoint."""

    def test_health_returns_200(self, client):
        response = client.get("/api/v1/recommendation-service/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestCollegeListEndpoint:
    """Test the college list endpoint."""

    @patch("app.db.mongo.get_mongo_db")
    def test_returns_paginated_list(self, mock_get_db, client, mock_mongo_db):
        mock_get_db.return_value = mock_mongo_db
        response = client.get("/api/v1/recommendation-service/college/list")
        assert response.status_code == 200
        data = response.json()
        assert "colleges" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    @patch("app.db.mongo.get_mongo_db")
    def test_search_filter(self, mock_get_db, client, mock_mongo_db):
        mock_get_db.return_value = mock_mongo_db
        # First call populates cache
        client.get("/api/v1/recommendation-service/college/list")
        # Second call with search
        response = client.get("/api/v1/recommendation-service/college/list?search=bombay")
        assert response.status_code == 200

    @patch("app.db.mongo.get_mongo_db")
    def test_type_filter(self, mock_get_db, client, mock_mongo_db):
        mock_get_db.return_value = mock_mongo_db
        client.get("/api/v1/recommendation-service/college/list")
        response = client.get("/api/v1/recommendation-service/college/list?type=IIT")
        assert response.status_code == 200


class TestCollegeDetailEndpoint:
    """Test the single college endpoint."""

    @patch("app.db.mongo.get_mongo_db")
    def test_returns_college_detail(self, mock_get_db, client, mock_mongo_db):
        # Setup mock to return a college and cutoffs
        mock_collection = MagicMock()
        mock_collection.find_one.return_value = {
            "college_id": "test-001",
            "official_josaa_name": "IIT Bombay",
            "state": "Maharashtra",
            "type": "IIT",
            "nirf_engineering_rank": 3,
        }
        mock_collection.find.return_value = [
            {"branch": "Computer Science", "quota": "AI", "year": 2024,
             "round": 1, "closing_rank": 100, "opening_rank": 1, "category": "OPEN"}
        ]
        
        mock_mongo_db.__getitem__ = MagicMock(return_value=mock_collection)
        mock_get_db.return_value = mock_mongo_db
        
        response = client.get("/api/v1/recommendation-service/college/test-001")
        assert response.status_code == 200
        data = response.json()
        assert "college_id" in data
        assert "branches" in data
        assert "available_years" in data

    @patch("app.db.mongo.get_mongo_db")
    def test_404_for_missing_college(self, mock_get_db, client, mock_mongo_db):
        mock_collection = MagicMock()
        mock_collection.find_one.return_value = None
        mock_mongo_db.__getitem__ = MagicMock(return_value=mock_collection)
        mock_get_db.return_value = mock_mongo_db
        
        response = client.get("/api/v1/recommendation-service/college/nonexistent")
        assert response.status_code == 404


class TestRecommendationsEndpoint:
    """Test the recommendations endpoint."""

    def test_rank_too_high_returns_empty(self, client):
        """A rank beyond max should return empty recommendations gracefully."""
        response = client.post("/api/v1/recommendation-service/recommendations", json={
            "rank": 99999999,
            "category": "OPEN",
            "quota": "AI",
            "counselling_type": "JOSAA",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 0
        assert "higher than the maximum" in data["explanation"]


class TestCollegeDataService:
    """Test the extracted service functions directly."""

    def test_extract_location(self):
        from app.services.college_data_service import extract_location
        assert "Mumbai" in extract_location("Indian Institute of Technology Bombay")
        assert extract_location("Unknown College XYZ") == ""

    def test_format_nirf_display(self):
        from app.services.college_data_service import format_nirf_display
        assert format_nirf_display(3) == "#3"
        assert format_nirf_display(125) == "101-150"
        assert format_nirf_display(175) == "151-200"
        assert format_nirf_display(250) == "201-300"
        assert format_nirf_display(None) is None
        assert format_nirf_display(0) is None

    def test_clean_display_name(self):
        from app.services.college_data_service import clean_display_name
        # Should not change names that don't end with redundant state
        assert clean_display_name("IIT Bombay", "Mumbai, Maharashtra") == "IIT Bombay"

    def test_parse_nirf_rank_empty(self):
        from app.services.college_data_service import parse_nirf_rank
        result = parse_nirf_rank({})
        assert result["nirf_rank"] is None
        assert result["nirf_display"] is None
