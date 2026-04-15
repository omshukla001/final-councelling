"""
SAFE/TARGET/DREAM classification service.
"""
from app.schemas.college import Classification
from app.utils.logger import logger


class ClassificationService:
    """Service for classifying colleges as SAFE, TARGET, or DREAM."""
    
    # Classification thresholds (as ratios of the cutoff rank)
    # SAFE: User's rank is <= 85% of cutoff rank (at least 15% margin)
    # TARGET: User's rank is between 85-105% of cutoff rank (between -5% and 15% margin)
    # DREAM: User's rank is between 105-125% of cutoff rank (up to 20% gap)
    SAFE_THRESHOLD = 0.85    # 85% of cutoff rank
    TARGET_THRESHOLD = 1.05  # 105% of cutoff rank
    DREAM_THRESHOLD = 1.25   # 125% of cutoff rank
    
    # Maximum rank in the database (updated based on actual data)
    MAX_RANK = 1000000

    @classmethod
    def get_max_rank(cls) -> int:
        """Return the maximum rank in the database."""
        return cls.MAX_RANK
        
    @classmethod
    def is_rank_too_high(cls, jee_rank: int) -> bool:
        """Check if the rank is higher than the maximum rank in the database."""
        return jee_rank > cls.MAX_RANK

    @classmethod
    def classify(cls, jee_rank: int, cutoff_closing_rank: int, category: str, quota: str) -> Classification:
        """
        Classify a college based on the user's JEE rank and the college's cutoff rank.
        
        Args:
            jee_rank: User's JEE rank
            cutoff_closing_rank: College's closing rank
            category: User's category (e.g., 'GEN', 'OBC', 'SC', 'ST')
            quota: Quota (e.g., 'AI', 'HS', 'OS')
            
        Returns:
            Classification: SAFE, TARGET, or DREAM
        """
        # Handle edge cases
        if cutoff_closing_rank <= 0:
            return None
            
        # Calculate rank ratio (user's rank / cutoff rank)
        rank_ratio = jee_rank / cutoff_closing_rank
        
        # Classify based on rank ratio
        if rank_ratio <= cls.SAFE_THRESHOLD:
            return Classification.SAFE
        elif rank_ratio <= cls.TARGET_THRESHOLD:
            return Classification.TARGET
        elif rank_ratio <= cls.DREAM_THRESHOLD:
            return Classification.DREAM
        else:
            # Rank is too high compared to cutoff
            return None
    
    @staticmethod
    def calculate_probability(jee_rank: int, cutoff_closing_rank: int) -> float:
        """
        Calculate probability score (0-1) for admission.
        
        Args:
            jee_rank: User's JEE rank
            cutoff_closing_rank: Closing rank for cutoff
            
        Returns:
            Probability score between 0 and 1
        """
        if cutoff_closing_rank <= 0:
            return 0.0
        
        if jee_rank <= cutoff_closing_rank:
            # Rank is better than or equal to cutoff
            if jee_rank <= cutoff_closing_rank * 0.5:
                return 0.95  # Very safe
            elif jee_rank <= cutoff_closing_rank * 0.8:
                return 0.85  # Safe
            else:
                return 0.70  # Moderate
        else:
            # Rank is worse than cutoff
            rank_ratio = jee_rank / cutoff_closing_rank
            if rank_ratio <= 1.1:
                return 0.50  # Borderline
            elif rank_ratio <= 1.3:
                return 0.30  # Difficult
            else:
                return 0.10  # Very difficult
