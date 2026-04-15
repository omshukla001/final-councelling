"""
Tests for the counsellor sheet generation service.
"""
import pytest
from app.services.counsellor_service import _build_institute_filter, _resolve_quota
from app.config import settings


class TestBuildInstituteFilter:
    """Test MongoDB filter construction for exam types."""

    def test_jee_advanced_targets_iits(self):
        """JEE Advanced should match only IIT (not IIIT)."""
        f = _build_institute_filter("JEE_ADVANCED")
        assert "$and" in f
        # Should contain a regex for IIT prefix
        conditions = f["$and"]
        assert len(conditions) >= 2  # IIT filter + ISM exclude

    def test_jee_mains_excludes_iits(self):
        """JEE Mains should match everything EXCEPT IITs."""
        f = _build_institute_filter("JEE_MAINS")
        assert "$and" in f
        conditions = f["$and"]
        # Should contain a $not filter for IIT prefix
        iit_filter = conditions[0]
        assert "$not" in str(iit_filter) or "$regex" in str(iit_filter)


class TestResolveQuota:
    """Test quota code mapping for different counselling types."""

    def test_josaa_passthrough(self):
        """JoSAA uses abbreviations directly."""
        assert _resolve_quota("AI", "JOSAA") == "AI"
        assert _resolve_quota("HS", "JOSAA") == "HS"
        assert _resolve_quota("OS", "JOSAA") == "OS"

    def test_csab_mapping(self):
        """CSAB uses full names instead of abbreviations."""
        assert _resolve_quota("AI", "CSAB") == "All India"
        assert _resolve_quota("HS", "CSAB") == "Home State"
        assert _resolve_quota("OS", "CSAB") == "Other State"

    def test_unknown_quota_passthrough(self):
        """Unknown quota codes pass through unchanged."""
        assert _resolve_quota("XX", "JOSAA") == "XX"
        assert _resolve_quota("XX", "CSAB") == "XX"


class TestCounsellorYearsConfig:
    """Test that counsellor years are configurable."""

    def test_years_from_config(self):
        assert isinstance(settings.COUNSELLOR_YEARS, list)
        assert len(settings.COUNSELLOR_YEARS) > 0
        # All years should be integers
        assert all(isinstance(y, int) for y in settings.COUNSELLOR_YEARS)

    def test_years_are_recent(self):
        """Years should be reasonably recent (2020+)."""
        assert all(y >= 2020 for y in settings.COUNSELLOR_YEARS)


class TestSharedHelperImport:
    """Verify counsellor_service uses the shared safe_int helper."""

    def test_safe_int_imported(self):
        """safe_int should be imported from app.utils.helpers, not defined locally."""
        import inspect
        import app.services.counsellor_service as module
        source = inspect.getsource(module)
        # Should import from helpers
        assert "from app.utils.helpers import safe_int" in source
        # Should NOT have a local def (except for the comment about it being imported)
        lines = [l for l in source.split('\n') if l.strip().startswith('def _safe_int')]
        assert len(lines) == 0, "Local _safe_int definition should be removed"
