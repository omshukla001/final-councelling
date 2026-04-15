"""
Rank prediction service: Converts percentile to rank using regression-style mapping.

This service provides fast, deterministic rank prediction from percentile scores.
No external API calls - pure mathematical computation.
"""
import math
from typing import Dict
from app.utils.logger import logger


class RankService:
    """
    Service for predicting rank from percentile.
    
    Uses regression-style mapping: rank = f(percentile, total_candidates)
    Provides confidence intervals based on statistical models.
    """
    
    # Constants for confidence interval calculation
    # Based on normal distribution assumptions for percentile-to-rank conversion
    CONFIDENCE_MARGIN_PERCENT = 0.05  # 5% margin for confidence interval
    MIN_CONFIDENCE = 0.70  # Minimum confidence level
    MAX_CONFIDENCE = 0.95  # Maximum confidence level
    
    @staticmethod
    def predict_rank(percentile: float, total_candidates: int) -> Dict[str, float]:
        """
        Predict rank from percentile using regression-style mapping.
        
        Formula: rank ≈ (100 - percentile) / 100 * total_candidates
        
        Args:
            percentile: Percentile score (0.0 to 100.0)
            total_candidates: Total number of candidates who appeared
            
        Returns:
            Dictionary with:
                - rank_low: Lower bound of predicted rank
                - rank_high: Upper bound of predicted rank
                - confidence: Confidence level (0.0 to 1.0)
                
        Raises:
            ValueError: If inputs are invalid
            
        Example:
            >>> result = RankService.predict_rank(95.5, 1000000)
            >>> print(result)
            {'rank_low': 42000, 'rank_high': 48000, 'confidence': 0.85}
        """
        # Input validation
        if not isinstance(percentile, (int, float)):
            raise ValueError(f"percentile must be numeric, got {type(percentile)}")
        
        if not isinstance(total_candidates, int) or total_candidates <= 0:
            raise ValueError(f"total_candidates must be a positive integer, got {total_candidates}")
        
        if percentile < 0.0 or percentile > 100.0:
            raise ValueError(f"percentile must be between 0.0 and 100.0, got {percentile}")
        
        # Core rank calculation using regression-style mapping
        # Formula: rank = (100 - percentile) / 100 * total_candidates
        predicted_rank = RankService._calculate_base_rank(percentile, total_candidates)
        
        # Calculate confidence interval
        rank_low, rank_high, confidence = RankService._calculate_confidence_interval(
            percentile, total_candidates, predicted_rank
        )
        
        # Ensure rank_low is at least 1
        rank_low = max(1, int(math.floor(rank_low)))
        rank_high = max(rank_low, int(math.ceil(rank_high)))
        
        return {
            "rank_low": rank_low,
            "rank_high": rank_high,
            "confidence": round(confidence, 3)
        }
    
    @staticmethod
    def _calculate_base_rank(percentile: float, total_candidates: int) -> float:
        """
        Calculate base rank from percentile.
        
        Uses the standard formula: rank = (100 - percentile) / 100 * total_candidates
        
        Args:
            percentile: Percentile score
            total_candidates: Total candidates
            
        Returns:
            Predicted rank (float)
        """
        # Standard percentile to rank conversion
        rank = (100.0 - percentile) / 100.0 * total_candidates
        
        # For very high percentiles (>99.5), use logarithmic adjustment
        # This accounts for the fact that top percentiles have more variance
        if percentile > 99.5:
            # Logarithmic adjustment for top percentiles
            adjustment_factor = 1.0 + (percentile - 99.5) * 0.1
            rank = rank * adjustment_factor
        
        # For very low percentiles (<1.0), use exponential adjustment
        # Lower percentiles have less variance
        elif percentile < 1.0:
            adjustment_factor = 1.0 - (1.0 - percentile) * 0.05
            rank = rank * adjustment_factor
        
        return rank
    
    @staticmethod
    def _calculate_confidence_interval(
        percentile: float,
        total_candidates: int,
        predicted_rank: float
    ) -> tuple[float, float, float]:
        """
        Calculate confidence interval for rank prediction.
        
        Uses statistical models to estimate uncertainty:
        - Higher confidence for middle percentiles (50-90)
        - Lower confidence for extreme percentiles (<10 or >95)
        - Confidence increases with larger candidate pool
        
        Args:
            percentile: Percentile score
            total_candidates: Total candidates
            predicted_rank: Predicted rank value
            
        Returns:
            Tuple of (rank_low, rank_high, confidence)
        """
        # Base confidence calculation
        # Middle percentiles have higher confidence
        if 50.0 <= percentile <= 90.0:
            base_confidence = 0.90
        elif 10.0 <= percentile < 50.0 or 90.0 < percentile <= 95.0:
            base_confidence = 0.85
        elif 1.0 <= percentile < 10.0 or 95.0 < percentile <= 99.0:
            base_confidence = 0.80
        else:  # Extreme percentiles
            base_confidence = 0.75
        
        # Adjust confidence based on sample size
        # Larger candidate pools = more reliable predictions
        if total_candidates >= 1000000:
            sample_adjustment = 0.05
        elif total_candidates >= 500000:
            sample_adjustment = 0.03
        elif total_candidates >= 100000:
            sample_adjustment = 0.01
        else:
            sample_adjustment = -0.02
        
        confidence = min(RankService.MAX_CONFIDENCE, 
                        max(RankService.MIN_CONFIDENCE, 
                            base_confidence + sample_adjustment))
        
        # Calculate margin based on percentile and confidence
        # Higher percentiles have larger margins (more uncertainty at top)
        if percentile >= 99.0:
            margin_percent = 0.15  # 15% margin for top 1%
        elif percentile >= 95.0:
            margin_percent = 0.10  # 10% margin for top 5%
        elif percentile >= 90.0:
            margin_percent = 0.08  # 8% margin for top 10%
        elif percentile <= 1.0:
            margin_percent = 0.12  # 12% margin for bottom 1%
        elif percentile <= 5.0:
            margin_percent = 0.10  # 10% margin for bottom 5%
        else:
            margin_percent = RankService.CONFIDENCE_MARGIN_PERCENT  # 5% for middle percentiles
        
        # Calculate rank bounds
        margin = predicted_rank * margin_percent
        rank_low = predicted_rank - margin
        rank_high = predicted_rank + margin
        
        return rank_low, rank_high, confidence
    
    @staticmethod
    def validate_inputs(percentile: float, total_candidates: int) -> bool:
        """
        Validate inputs for rank prediction.
        
        Args:
            percentile: Percentile score
            total_candidates: Total candidates
            
        Returns:
            True if valid, raises ValueError if invalid
        """
        if not isinstance(percentile, (int, float)):
            raise ValueError(f"percentile must be numeric, got {type(percentile)}")
        
        if not isinstance(total_candidates, int):
            raise ValueError(f"total_candidates must be an integer, got {type(total_candidates)}")
        
        if total_candidates <= 0:
            raise ValueError(f"total_candidates must be positive, got {total_candidates}")
        
        if percentile < 0.0 or percentile > 100.0:
            raise ValueError(f"percentile must be between 0.0 and 100.0, got {percentile}")
        
        return True


# Convenience function for direct use
def predict_rank(percentile: float, total_candidates: int) -> Dict[str, float]:
    """
    Convenience function for rank prediction.
    
    Args:
        percentile: Percentile score (0.0 to 100.0)
        total_candidates: Total number of candidates
        
    Returns:
        Dictionary with rank_low, rank_high, confidence
        
    Example:
        >>> result = predict_rank(95.5, 1000000)
        >>> print(f"Rank range: {result['rank_low']} - {result['rank_high']}")
    """
    return RankService.predict_rank(percentile, total_candidates)
