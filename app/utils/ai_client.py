"""
AI/LLM client for explanations — uses Groq (OpenAI-compatible).
"""
import asyncio
from typing import Optional
from openai import OpenAI
from app.config import settings
from app.utils.logger import logger


class AIClient:
    """
    Unified AI client using Groq's OpenAI-compatible API.
    Used for generating explanations in the main backend services.
    """

    def __init__(self):
        api_key = settings.effective_groq_key
        if api_key:
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1",
            )
        else:
            self.client = None
            logger.warning("Groq API key not configured — AI explanations will use fallback text.")

    async def generate_explanation(
        self,
        prompt: str,
        context: Optional[dict] = None,
    ) -> str:
        """Generate explanation using Groq LLM."""
        try:
            if not self.client:
                return self._fallback_explanation(prompt, context)

            full_prompt = prompt
            if context:
                context_str = "\n".join(f"{k}: {v}" for k, v in context.items())
                full_prompt = f"Context:\n{context_str}\n\nQuestion: {prompt}\n\nProvide a clear, concise explanation:"

            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a helpful JEE counseling assistant."},
                        {"role": "user", "content": full_prompt},
                    ],
                    max_tokens=500,
                    temperature=0.7,
                ),
            )
            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"Groq API call failed: {e}")
            return self._fallback_explanation(prompt, context)

    def _fallback_explanation(self, prompt: str, context: Optional[dict]) -> str:
        return f"Explanation for: {prompt}"


# Singleton instance
ai_client = AIClient()
