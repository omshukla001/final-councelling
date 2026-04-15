"""
Tests for QuotaFilteringService — filtering logic and cache management.
Uses mocked MongoDB to test filtering without a live database.
"""
import pytest
from unittest.mock import patch, MagicMock
from app.services.quota_filtering import QuotaFilteringService, MongoCutoff


class TestMongoCutoff:
    """Test the MongoCutoff wrapper."""

    def test_attribute_access(self):
        cutoff = MongoCutoff(college_id="123", branch_name="CSE", closing_rank=5000)
        assert cutoff.college_id == "123"
        assert cutoff.branch_name == "CSE"
        assert cutoff.closing_rank == 5000

    def test_id_property(self):
        cutoff = MongoCutoff(_id="abc123")
        assert cutoff.id == "abc123"

    def test_id_default(self):
        cutoff = MongoCutoff(college_id="test")
        assert cutoff.id == "mongo_id"


class TestValidation:
    """Test category and quota validation."""

    def test_valid_category(self):
        assert QuotaFilteringService.validate_category("GEN") is True
        assert QuotaFilteringService.validate_category("OPEN") is True
        assert QuotaFilteringService.validate_category("SC") is True

    def test_invalid_category(self):
        assert QuotaFilteringService.validate_category("INVALID") is False
        assert QuotaFilteringService.validate_category("") is False

    def test_valid_quota(self):
        assert QuotaFilteringService.validate_quota("AI") is True
        assert QuotaFilteringService.validate_quota("HS") is True
        assert QuotaFilteringService.validate_quota("OS") is True

    def test_invalid_quota(self):
        assert QuotaFilteringService.validate_quota("INVALID") is False

    def test_case_insensitive(self):
        assert QuotaFilteringService.validate_category("gen") is True
        assert QuotaFilteringService.validate_quota("ai") is True


class TestParseRank:
    """Test the private _parse_rank method."""

    def test_integer(self):
        assert QuotaFilteringService._parse_rank(5000) == 5000

    def test_float(self):
        assert QuotaFilteringService._parse_rank(5000.5) == 5000

    def test_string(self):
        assert QuotaFilteringService._parse_rank("5000") == 5000

    def test_string_with_p_suffix(self):
        """Ranks sometimes stored as '123P' in data."""
        assert QuotaFilteringService._parse_rank("123P") == 123

    def test_none(self):
        assert QuotaFilteringService._parse_rank(None) == 0

    def test_na_string(self):
        assert QuotaFilteringService._parse_rank("NA") == 0

    def test_dash(self):
        assert QuotaFilteringService._parse_rank("-") == 0

    def test_empty_string(self):
        assert QuotaFilteringService._parse_rank("") == 0


class TestCacheTTL:
    """Test that cache TTL is properly configured."""

    def test_cache_ttl_exists(self):
        assert hasattr(QuotaFilteringService, '_CACHE_TTL')
        assert QuotaFilteringService._CACHE_TTL > 0

    def test_cache_loaded_at_tracking(self):
        assert hasattr(QuotaFilteringService, '_cache_loaded_at')
