"""
Tests for ClassificationService — SAFE/TARGET/DREAM classification.
"""
import pytest
from app.services.classification import ClassificationService
from app.schemas.college import Classification


class TestClassify:
    """Test the classify() method with various rank/cutoff combinations."""

    def test_safe_classification(self):
        """Rank much better than cutoff → SAFE."""
        result = ClassificationService.classify(5000, 10000, "GEN", "AI")
        assert result == Classification.SAFE

    def test_safe_boundary(self):
        """Rank at exactly 85% of cutoff → still SAFE."""
        result = ClassificationService.classify(8500, 10000, "GEN", "AI")
        assert result == Classification.SAFE

    def test_target_classification(self):
        """Rank close to cutoff → TARGET."""
        result = ClassificationService.classify(9500, 10000, "GEN", "AI")
        assert result == Classification.TARGET

    def test_target_boundary_upper(self):
        """Rank at exactly 105% of cutoff → still TARGET."""
        result = ClassificationService.classify(10500, 10000, "GEN", "AI")
        assert result == Classification.TARGET

    def test_dream_classification(self):
        """Rank moderately worse than cutoff → DREAM."""
        result = ClassificationService.classify(11500, 10000, "GEN", "AI")
        assert result == Classification.DREAM

    def test_dream_boundary(self):
        """Rank at exactly 125% of cutoff → still DREAM."""
        result = ClassificationService.classify(12500, 10000, "GEN", "AI")
        assert result == Classification.DREAM

    def test_beyond_dream(self):
        """Rank way worse than cutoff → None (unreachable)."""
        result = ClassificationService.classify(15000, 10000, "GEN", "AI")
        assert result is None

    def test_zero_cutoff(self):
        """Zero cutoff should return None."""
        result = ClassificationService.classify(5000, 0, "GEN", "AI")
        assert result is None

    def test_negative_cutoff(self):
        """Negative cutoff should return None."""
        result = ClassificationService.classify(5000, -100, "GEN", "AI")
        assert result is None

    def test_rank_one(self):
        """Rank 1 should always be SAFE."""
        result = ClassificationService.classify(1, 50000, "GEN", "AI")
        assert result == Classification.SAFE

    def test_equal_rank_and_cutoff(self):
        """Rank == Cutoff → TARGET (ratio = 1.0, within 0.85-1.05)."""
        result = ClassificationService.classify(10000, 10000, "GEN", "AI")
        assert result == Classification.TARGET


class TestProbability:
    """Test the calculate_probability() method."""

    def test_very_safe(self):
        """Rank ≤ 50% of cutoff → 0.95."""
        prob = ClassificationService.calculate_probability(3000, 10000)
        assert prob == 0.95

    def test_safe(self):
        """Rank 50-80% of cutoff → 0.85."""
        prob = ClassificationService.calculate_probability(7000, 10000)
        assert prob == 0.85

    def test_moderate(self):
        """Rank 80-100% of cutoff → 0.70."""
        prob = ClassificationService.calculate_probability(9000, 10000)
        assert prob == 0.70

    def test_borderline(self):
        """Rank 100-110% of cutoff → 0.50."""
        prob = ClassificationService.calculate_probability(10500, 10000)
        assert prob == 0.50

    def test_difficult(self):
        """Rank 110-130% of cutoff → 0.30."""
        prob = ClassificationService.calculate_probability(12000, 10000)
        assert prob == 0.30

    def test_very_difficult(self):
        """Rank > 130% of cutoff → 0.10."""
        prob = ClassificationService.calculate_probability(15000, 10000)
        assert prob == 0.10

    def test_zero_cutoff_returns_zero(self):
        """Zero cutoff → 0.0 probability."""
        prob = ClassificationService.calculate_probability(5000, 0)
        assert prob == 0.0


class TestHelpers:
    """Test helper methods."""

    def test_max_rank(self):
        assert ClassificationService.get_max_rank() == 1000000

    def test_rank_not_too_high(self):
        assert ClassificationService.is_rank_too_high(500000) is False

    def test_rank_too_high(self):
        assert ClassificationService.is_rank_too_high(1500000) is True

    def test_rank_at_max(self):
        assert ClassificationService.is_rank_too_high(1000000) is False
