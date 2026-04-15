"""
Tests for RankService — percentile-to-rank conversion.
"""
import pytest
from app.services.rank_service import RankService, predict_rank


class TestPredictRank:
    """Test the main predict_rank method."""

    def test_basic_prediction(self):
        """95th percentile out of 1M candidates ≈ rank 50000."""
        result = RankService.predict_rank(95.0, 1000000)
        assert result["rank_low"] < 50000
        assert result["rank_high"] > 50000
        assert 0.0 < result["confidence"] <= 1.0

    def test_50th_percentile(self):
        """50th percentile → rank ≈ 500000 out of 1M."""
        result = RankService.predict_rank(50.0, 1000000)
        assert 400000 <= result["rank_low"]
        assert result["rank_high"] <= 600000

    def test_99th_percentile(self):
        """99th percentile → rank ≈ 10000 out of 1M."""
        result = RankService.predict_rank(99.0, 1000000)
        assert result["rank_low"] >= 1
        assert result["rank_high"] <= 20000

    def test_rank_low_never_zero(self):
        """rank_low should be at least 1."""
        result = RankService.predict_rank(99.99, 1000000)
        assert result["rank_low"] >= 1

    def test_rank_high_gte_rank_low(self):
        """rank_high should always be >= rank_low."""
        result = RankService.predict_rank(75.0, 500000)
        assert result["rank_high"] >= result["rank_low"]

    def test_confidence_in_range(self):
        """Confidence should be between MIN and MAX."""
        result = RankService.predict_rank(80.0, 500000)
        assert RankService.MIN_CONFIDENCE <= result["confidence"] <= RankService.MAX_CONFIDENCE

    def test_higher_percentile_lower_rank(self):
        """Higher percentile should give lower (better) rank."""
        r1 = RankService.predict_rank(90.0, 1000000)
        r2 = RankService.predict_rank(80.0, 1000000)
        assert r1["rank_high"] < r2["rank_low"]

    def test_convenience_function(self):
        """predict_rank() standalone function should work."""
        result = predict_rank(85.0, 1000000)
        assert "rank_low" in result
        assert "rank_high" in result
        assert "confidence" in result


class TestInputValidation:
    """Test input validation."""

    def test_negative_percentile(self):
        with pytest.raises(ValueError, match="percentile must be between"):
            RankService.predict_rank(-5.0, 1000000)

    def test_percentile_over_100(self):
        with pytest.raises(ValueError, match="percentile must be between"):
            RankService.predict_rank(101.0, 1000000)

    def test_zero_candidates(self):
        with pytest.raises(ValueError, match="total_candidates must be a positive"):
            RankService.predict_rank(90.0, 0)

    def test_negative_candidates(self):
        with pytest.raises(ValueError, match="total_candidates must be a positive"):
            RankService.predict_rank(90.0, -100)

    def test_string_percentile(self):
        with pytest.raises(ValueError, match="percentile must be numeric"):
            RankService.predict_rank("ninety", 1000000)


class TestConfidenceInterval:
    """Test confidence interval logic."""

    def test_middle_percentile_high_confidence(self):
        """50-90 percentile range should have highest confidence."""
        result = RankService.predict_rank(70.0, 1000000)
        assert result["confidence"] >= 0.90

    def test_extreme_percentile_lower_confidence(self):
        """Very high/low percentiles should have lower confidence."""
        result = RankService.predict_rank(99.8, 1000000)
        result_mid = RankService.predict_rank(70.0, 1000000)
        assert result["confidence"] <= result_mid["confidence"]

    def test_large_pool_higher_confidence(self):
        """Larger candidate pool should give higher confidence."""
        r_large = RankService.predict_rank(80.0, 1000000)
        r_small = RankService.predict_rank(80.0, 50000)
        assert r_large["confidence"] >= r_small["confidence"]


class TestEdgeCases:
    """Test edge cases."""

    def test_percentile_zero(self):
        """0th percentile → largest rank."""
        result = RankService.predict_rank(0.0, 1000000)
        assert result["rank_high"] >= 900000

    def test_percentile_100(self):
        """100th percentile → rank 1."""
        result = RankService.predict_rank(100.0, 1000000)
        assert result["rank_low"] == 1

    def test_integer_percentile(self):
        """Integer input should work (auto-cast)."""
        result = RankService.predict_rank(90, 1000000)
        assert "rank_low" in result

    def test_small_candidate_pool(self):
        """Small pool should still return valid results."""
        result = RankService.predict_rank(50.0, 100)
        assert result["rank_low"] >= 1
        assert result["rank_high"] <= 100
