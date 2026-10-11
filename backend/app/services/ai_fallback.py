"""Sequential, bounded explanation fallback; never changes financial calculations."""
import json
import os
import re
import time
from contextvars import ContextVar
import httpx
from backend.app.services import gemini
from backend.app.services.budget import reserve

_trace = ContextVar("ai_provider_trace", default=None)
PROVIDERS = ("openrouter", "groq", "gemini")

def trace():
    return dict(_trace.get() or {p: "not_requested" for p in PROVIDERS})

_UNSUPPORTED_NUMBER = re.compile(
    r"[\d$%€£]|\b(three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|dollars?|percent(?:age)?s?)\b",
    re.I,
)
_INTERNAL_MARKER = re.compile(
    r"\b(?:user safety|safety classification|request status|backend request|reply received)\s*:",
    re.I,
)


def clean_reply(text, context):
    """Keep useful qualitative sentences while dropping unsupported numeric claims/citations."""
    if not isinstance(text, str) or not text.strip() or len(text) > 7000:
        return None, "invalid_output"
    if _INTERNAL_MARKER.search(text):
        return None, "rejected_response"
    try:
        count = len(json.loads(context).get("evidence", []))
    except (ValueError, TypeError):
        count = 0
    kept = []
    removed_number = False
    removed_citation = False
    # A single bad sentence should not discard the rest of an otherwise useful answer.
    sentences = re.split(r"(?<=[.!?])\s+|\s*\n+\s*", text.strip())
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        citations = re.findall(r"\[S(\d+)\]", sentence)
        if any(not 1 <= int(n) <= count for n in citations):
            removed_citation = True
            continue
        without_citations = re.sub(r"\[S\d+\]", "", sentence)
        if _UNSUPPORTED_NUMBER.search(without_citations):
            removed_number = True
            continue
        kept.append(sentence)
    if kept:
        return " ".join(kept), "complete"
    if removed_citation:
        return None, "invalid_citation"
    if removed_number:
        return None, "unsupported_numbers"
    return None, "invalid_output"


def usable(text, context):
    return clean_reply(text, context)[0] is not None

def chat(provider, system, context, timeout):
    key = os.getenv(provider.upper() + "_API_KEY", "")
    if not key:
        return None, 0, "not_configured"
    # dotenv files commonly contain blank model entries; treat blank the same
    # as unset so a configured API key still uses the supported default.
    model = os.getenv(provider.upper() + "_MODEL", "").strip()
    if not model:
        model = "openai/gpt-oss-20b" if provider == "groq" else "openrouter/free"
    if provider == "openrouter" and not (model.endswith(":free") or model == "openrouter/free"):
        return None, 0, "free_model_required"
    if not re.fullmatch(r"[a-zA-Z0-9._:/-]+", model):
        return None, 0, "invalid_model"
    if not reserve(provider):
        return None, 0, "budget_or_host_limit"
    url = "https://api.groq.com/openai/v1/chat/completions" if provider == "groq" else "https://openrouter.ai/api/v1/chat/completions"
    payload = {"model": model, "messages": [{"role": "system", "content": system}, {"role": "user", "content": context}], "temperature": .2, "max_tokens": 4096}
    # Reasoning shares the output budget; leave room for the final explanation.
    if provider == "groq" and model in ("openai/gpt-oss-20b", "openai/gpt-oss-120b"):
        payload.update(reasoning_effort="low", include_reasoning=False)
    elif provider == "openrouter":
        # Keep free reasoning models from spending the whole completion budget
        # before they produce the short user-facing explanation.
        payload["reasoning"] = {"effort": "low", "max_tokens": 512, "exclude": True}
    try:
        r = httpx.post(url, headers={"Authorization": "Bearer " + key},
                       json=payload, timeout=timeout)
        r.raise_for_status()
        data = r.json()
        if not isinstance(data, dict):
            return None, 1, "invalid_output"
        if data.get("error"):
            return None, 1, "unavailable"
        choices = data.get("choices")
        if not isinstance(choices, list) or not choices or not isinstance(choices[0], dict):
            return None, 1, "invalid_output"
        choice = choices[0]
        if choice.get("finish_reason") != "stop":
            return None, 1, "incomplete_response"
        message = choice.get("message")
        if not isinstance(message, dict):
            return None, 1, "invalid_output"
        content = message.get("content")
        if isinstance(content, list):
            text = "\n".join(part["text"] for part in content
                              if isinstance(part, dict) and isinstance(part.get("text"), str))
        else:
            text = content
        return (text, 1, "complete") if isinstance(text, str) and text.strip() else (None, 1, "empty_response")
    except httpx.HTTPStatusError as e:
        return None, 1, {401: "invalid_key", 402: "quota_reached", 403: "permission_denied", 404: "model_unavailable", 429: "quota_reached", 503: "provider_busy"}.get(e.response.status_code, "unavailable")
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, AttributeError):
        return None, 1, "unavailable"

def generate(system, context):
    statuses = {p: "not_requested" for p in PROVIDERS}
    statuses["explanation_provider"] = "calculated"
    _trace.set(statuses)
    calls = 0
    deadline = time.monotonic() + 45
    for provider in PROVIDERS:
        remaining = deadline - time.monotonic()
        if remaining < 1:
            statuses[provider] = "time_limit"
            break
        timeout = min(12, remaining)
        text, count, status = gemini.generate(system, context, timeout=timeout) if provider == "gemini" else chat(provider, system, context, timeout)
        calls += count
        if text:
            text, cleaned_status = clean_reply(text, context)
            if not text:
                status = cleaned_status
        statuses[provider] = status
        if text and status == "complete":
            statuses["explanation_provider"] = provider
            return text, calls, "complete"
    return None, calls, statuses["gemini"] if statuses["gemini"] != "not_configured" else "not_configured"
