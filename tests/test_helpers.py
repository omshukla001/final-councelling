"""
Tests for shared utility helpers.
"""
import pytest
from app.utils.helpers import safe_int, extract_college_type, is_ism_dhanbad


class TestSafeInt:
    """Test safe_int conversion."""

    def test_integer_input(self):
        assert safe_int(42) == 42

    def test_string_input(self):
        assert safe_int("123") == 123

    def test_string_with_whitespace(self):
        assert safe_int("  456  ") == 456

    def test_none_returns_zero(self):
        assert safe_int(None) == 0

    def test_invalid_string_returns_zero(self):
        assert safe_int("not-a-number") == 0

    def test_empty_string_returns_zero(self):
        assert safe_int("") == 0

    def test_float_input(self):
        assert safe_int(3.14) == 3

    def test_float_string_input(self):
        assert safe_int("99.5") == 99

    def test_negative(self):
        assert safe_int(-10) == -10

    def test_zero(self):
        assert safe_int(0) == 0


class TestExtractCollegeType:
    """Test college type extraction from name."""

    def test_iit(self):
        assert extract_college_type("Indian Institute of Technology Bombay") == "IIT"

    def test_iit_short(self):
        assert extract_college_type("IIT Delhi") == "IIT"

    def test_nit(self):
        assert extract_college_type("National Institute of Technology Trichy") == "NIT"

    def test_nit_short(self):
        assert extract_college_type("NIT Warangal") == "NIT"

    def test_iiit(self):
        assert extract_college_type("Indian Institute of Information Technology Allahabad") == "IIIT"

    def test_iiit_short(self):
        assert extract_college_type("IIIT Hyderabad") == "IIIT"

    def test_iiit_not_mistaken_for_iit(self):
        """IIIT names contain 'Indian Institute of Technology' substring — must not be IIT."""
        assert extract_college_type("Indian Institute of Information Technology Gwalior") == "IIIT"

    def test_gfti_fallback(self):
        assert extract_college_type("Dr. B R Ambedkar NIT Jalandhar") == "NIT"

    def test_unknown_is_gfti(self):
        assert extract_college_type("Some Random College") == "GFTI"

    def test_empty_name(self):
        assert extract_college_type("") == "GFTI"

    def test_none_name(self):
        assert extract_college_type(None) == "GFTI"


class TestIsIsmDhanbad:
    """Test ISM Dhanbad duplicate detection."""

    def test_matches_ism(self):
        assert is_ism_dhanbad("Indian School of Mines Dhanbad") is True

    def test_case_insensitive(self):
        assert is_ism_dhanbad("indian school of mines") is True

    def test_not_ism(self):
        assert is_ism_dhanbad("IIT (ISM) Dhanbad") is False

    def test_empty(self):
        assert is_ism_dhanbad("") is False

    def test_none(self):
        assert is_ism_dhanbad(None) is False
