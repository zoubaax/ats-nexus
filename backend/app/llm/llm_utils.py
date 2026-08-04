"""
Utility functions for LLM providers.
"""

import os
import logging
from typing import Any, Dict, Optional
import urllib.request
import json

try:
    from app.config import provider_for
    from app.core.models import OpenAICompatibleProvider
except ImportError:
    try:
        from backend.app.config import provider_for
        from backend.app.core.models import OpenAICompatibleProvider
    except ImportError:
        from config import provider_for
        from models import OpenAICompatibleProvider

logger = logging.getLogger(__name__)


def extract_json_from_response(response_text: str) -> str:
    """
    Extract JSON content from markdown code blocks.
    """
    response_text = response_text.strip()
    if "<think>" in response_text:
        think_start = response_text.find("<think>")
        think_end = response_text.find("</think>")
        if think_start != -1 and think_end != -1:
            response_text = response_text[:think_start] + response_text[think_end + 8 :]

    if response_text.startswith("```json"):
        response_text = response_text[7:]
    elif response_text.startswith("```"):
        response_text = response_text[3:]

    if response_text.endswith("```"):
        response_text = response_text[:-3]

    return response_text.strip()


def query_llm(prompt: str, provider: str = "groq", api_key: Optional[str] = None) -> str:
    """
    Query an LLM provider (Groq, Nvidia, Gemini, Ollama) and return text response.
    """
    prov = (provider or "groq").lower()

    # Determine Base URL and API Key per provider
    if prov == "groq":
        key = api_key or os.getenv("GROQ_API_KEY", "")
        url = "https://api.groq.com/openai/v1/chat/completions"
        model = "llama-3.3-70b-versatile"
    elif prov == "nvidia":
        key = api_key or os.getenv("NVIDIA_API_KEY", "")
        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        model = "meta/llama-3.3-70b-instruct"
    elif prov == "gemini":
        key = api_key or os.getenv("GEMINI_API_KEY", "")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
        # Gemini direct REST structure
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                return res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as err:
            logger.error(f"Gemini API error: {err}")
            raise err
    else:
        # Default / Ollama local
        key = api_key or "ollama"
        url = "http://localhost:11434/v1/chat/completions"
        model = "llama3"

    # Standard OpenAI-compatible format (Groq, Nvidia, Ollama)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {key}",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers=headers
    )

    try:
        with urllib.request.urlopen(req) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            return res_data["choices"][0]["message"]["content"]
    except Exception as err:
        logger.error(f"LLM Provider {prov} error: {err}")
        raise err
