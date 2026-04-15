"""
Tests for the RAG pipeline — context retrieval and answer generation.
Uses mocked external services (Groq, Pinecone, SentenceTransformer).
"""
import pytest
from unittest.mock import patch, MagicMock
import re


class TestExtractRank:
    """Test rank extraction from user questions."""

    def test_basic_rank(self):
        from app.services.rag_pipeline import _extract_rank
        assert _extract_rank("My rank is 5000") == 5000

    def test_rank_in_context(self):
        from app.services.rag_pipeline import _extract_rank
        assert _extract_rank("I got 12345 in JEE Main") == 12345

    def test_no_rank(self):
        from app.services.rag_pipeline import _extract_rank
        assert _extract_rank("What is the best college?") is None

    def test_rank_too_short(self):
        """Ranks below 3 digits are likely not JEE ranks."""
        from app.services.rag_pipeline import _extract_rank
        assert _extract_rank("I scored 99 percentile") is None

    def test_rank_from_chat_history(self):
        from app.services.rag_pipeline import _extract_rank
        history = [
            {"role": "user", "content": "My rank is 8000"},
            {"role": "assistant", "content": "Great rank!"}
        ]
        assert _extract_rank("What colleges can I get?", history) == 8000

    def test_latest_rank_from_history(self):
        """Should return the most recent rank from history."""
        from app.services.rag_pipeline import _extract_rank
        history = [
            {"role": "user", "content": "My rank is 8000"},
            {"role": "user", "content": "Actually it's 5000"},
        ]
        assert _extract_rank("What now?", history) == 5000


class TestConfigIntegration:
    """Test that RAG pipeline uses centralized config."""

    def test_uses_config_model(self):
        from app.services.rag_pipeline import GENERATION_MODEL
        from app.config import settings
        assert GENERATION_MODEL == settings.GENERATION_MODEL

    def test_uses_config_embedding_model(self):
        from app.services.rag_pipeline import LOCAL_EMBED_MODEL
        from app.config import settings
        assert LOCAL_EMBED_MODEL == settings.EMBEDDING_MODEL

    def test_uses_config_top_k(self):
        from app.services.rag_pipeline import TOP_K
        from app.config import settings
        assert TOP_K == settings.AI_TOP_K


class TestDeadCodeRemoval:
    """Verify dead code was properly cleaned up."""

    def test_old_system_prompt_removed(self):
        """The old SYSTEM_PROMPT (replaced by new_system_prompt) should be gone."""
        import app.services.rag_pipeline as module
        # The old SYSTEM_PROMPT variable should not exist at module level
        assert not hasattr(module, 'SYSTEM_PROMPT'), "Dead SYSTEM_PROMPT was not removed"

    def test_ai_chat_service_deleted(self):
        """The unused ai_chat_service.py should be deleted."""
        import importlib
        with pytest.raises(ModuleNotFoundError):
            importlib.import_module("app.services.ai_chat_service")
