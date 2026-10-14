"""Server-side Gemini REST adapter. No API keys or raw responses reach the client."""

import os
import re
import httpx
from backend.app.services.budget import reserve


def configured():
    return bool(os.getenv("GEMINI_API_KEY"))


def generate(system: str, context: str, timeout: float = 30):
    if not configured():
        return None, 0, "not_configured"
    if not reserve("gemini"):
        return None, 0, "budget_or_host_limit"
    model = os.getenv("GEMINI_MODEL", "").strip() or "gemini-3.5-flash-lite"
    if not re.fullmatch(r"[a-zA-Z0-9._-]+", model):
        return None, 0, "invalid_model"
    generation_config = {"temperature": 1.0 if model.startswith("gemini-3") else 0.2,
                         "maxOutputTokens": 8192}
    if model.startswith("gemini-3"):
        generation_config["thinkingConfig"] = {"thinkingLevel": "low"}
    elif model.startswith("gemini-2.5"):
        generation_config["thinkingConfig"] = {"thinkingBudget": 1024}
    try:
        response = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"]},
            json={"systemInstruction": {"parts": [{"text": system}]},
                  "contents": [{"role": "user", "parts": [{"text": context}]}],
                  "generationConfig": generation_config}, timeout=timeout,
        )
        response.raise_for_status()
        data = response.json()
        candidates = data.get("candidates") if isinstance(data, dict) else None
        if not isinstance(candidates, list) or not candidates or not isinstance(candidates[0], dict):
            return None, 1, "invalid_output"
        candidate = candidates[0]
        if candidate.get("finishReason", "STOP") != "STOP":
            return None, 1, "incomplete_response"
        content = candidate.get("content")
        parts = content.get("parts") if isinstance(content, dict) else None
        if not isinstance(parts, list):
            return None, 1, "invalid_output"
        text = "\n".join(p["text"] for p in parts if isinstance(p.get("text"), str) and not p.get("thought"))
        if len(text) > 7000:
            return None, 1, "incomplete_response"
        return (text, 1, "complete") if text.strip() else (None, 1, "empty_response")
    except httpx.HTTPStatusError as error:
        status = {401: "invalid_key", 403: "permission_denied", 404: "model_unavailable", 429: "quota_reached", 503: "provider_busy"}.get(error.response.status_code, "unavailable")
        return None, 1, status
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, AttributeError):
        return None, 1, "unavailable"
