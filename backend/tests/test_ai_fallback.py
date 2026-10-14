import json
from unittest.mock import patch
import httpx
from backend.app.services import ai_fallback as ai

CONTEXT = json.dumps({"evidence": [{"reference": "S1"}]})
TEXT = "Water efficiency is one option worth reviewing with your builder. [S1]"

def reply(text=TEXT):
    return httpx.Response(200, request=httpx.Request("POST", "https://api.groq.com"), json={"choices": [{"finish_reason": "stop", "message": {"content": text}}]})

def keys(monkeypatch):
    for p in ai.PROVIDERS:
        monkeypatch.setenv(p.upper() + "_API_KEY", "test-key")
    # Provider tests should not consume or depend on the user's daily quota.
    monkeypatch.setattr(ai, "reserve", lambda provider: True)
    monkeypatch.setattr(ai.gemini, "reserve", lambda provider: True)

def test_first_success_does_not_call_backups(monkeypatch):
    keys(monkeypatch)
    with patch.object(ai.gemini, "generate") as gemini, patch.object(ai.httpx, "post", return_value=reply()) as request:
        assert ai.generate("system", CONTEXT) == (TEXT, 1, "complete")
        assert request.call_count == 1
        assert request.call_args.args[0].startswith("https://openrouter.ai/")
        gemini.assert_not_called()
    assert ai.trace()["explanation_provider"] == "openrouter"
    assert ai.trace()["groq"] == "not_requested"
    assert ai.trace()["gemini"] == "not_requested"


def test_second_success_never_calls_third(monkeypatch):
    keys(monkeypatch)
    failure = httpx.Response(429, request=httpx.Request("POST", "https://openrouter.ai"))
    with patch.object(ai.gemini, "generate") as gemini, patch.object(ai.httpx, "post", side_effect=[failure, reply()]) as request:
        assert ai.generate("system", CONTEXT) == (TEXT, 2, "complete")
        assert request.call_count == 2
        assert request.call_args.args[0].startswith("https://api.groq.com/")
        gemini.assert_not_called()
    assert ai.trace()["openrouter"] == "quota_reached"
    assert ai.trace()["gemini"] == "not_requested"
    assert ai.trace()["explanation_provider"] == "groq"


def test_invalid_second_response_reaches_third(monkeypatch):
    keys(monkeypatch)
    with patch.object(ai.gemini, "generate", return_value=(TEXT, 1, "complete")) as gemini, patch.object(ai.httpx, "post", side_effect=[reply("You save $999."), reply("Advice [S99]")]) as request:
        assert ai.generate("system", CONTEXT) == (TEXT, 3, "complete")
        assert request.call_count == 2
        gemini.assert_called_once()
    assert ai.trace()["openrouter"] == "unsupported_numbers"
    assert ai.trace()["groq"] == "invalid_citation"
    assert ai.trace()["explanation_provider"] == "gemini"


def test_missing_keys_make_no_requests():
    with patch.object(ai.httpx, "post") as request:
        assert ai.generate("system", CONTEXT)[0] is None
        request.assert_not_called()
    assert ai.trace()["explanation_provider"] == "calculated"

def test_paid_openrouter_model_is_not_called(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setenv("OPENROUTER_MODEL", "paid/model")
    with patch.object(ai.httpx, "post") as request:
        ai.generate("system", CONTEXT)
        request.assert_not_called()
    assert ai.trace()["openrouter"] == "free_model_required"

def test_invalid_citation_rejected():
    assert not ai.usable("Advice [S99]", CONTEXT)
    assert not ai.usable("You save five dollars.", CONTEXT)
    assert ai.usable(TEXT, CONTEXT)


def test_bad_numeric_sentence_is_removed_without_losing_ai_answer(monkeypatch):
    keys(monkeypatch)
    mixed = "You save $999. Check the insulation details with your builder. [S1]"
    with patch.object(ai.httpx, "post", return_value=reply(mixed)):
        assert ai.generate("system", CONTEXT) == (
            "Check the insulation details with your builder. [S1]", 1, "complete")


def test_reasoning_models_leave_budget_for_final_answer(monkeypatch):
    keys(monkeypatch)
    monkeypatch.setenv("GROQ_MODEL", "openai/gpt-oss-20b")
    monkeypatch.setenv("OPENROUTER_MODEL", "openrouter/free")
    with patch.object(ai.httpx, "post", return_value=reply()) as request:
        ai.chat("groq", "system", CONTEXT, 12)
        payload = request.call_args.kwargs["json"]
        assert payload["reasoning_effort"] == "low"
        assert payload["include_reasoning"] is False
        assert payload["max_tokens"] == 4096
        ai.chat("openrouter", "system", CONTEXT, 12)
        assert request.call_args.kwargs["json"]["reasoning"] == {"effort": "low", "exclude": True}


def test_openrouter_never_sends_two_reasoning_controls(monkeypatch):
    # OpenRouter rejects a request that sets both reasoning.effort and
    # reasoning.max_tokens with HTTP 400, so only one control may be sent.
    keys(monkeypatch)
    monkeypatch.setenv("OPENROUTER_MODEL", "openrouter/free")
    with patch.object(ai.httpx, "post", return_value=reply()) as request:
        ai.chat("openrouter", "system", CONTEXT, 12)
        reasoning = request.call_args.kwargs["json"]["reasoning"]
        assert not ("effort" in reasoning and "max_tokens" in reasoning)


def test_rejected_request_is_reported_without_masking_as_unavailable(monkeypatch):
    keys(monkeypatch)
    rejected = httpx.Response(400, request=httpx.Request("POST", "https://openrouter.ai"),
                              json={"error": {"message": "Only one reasoning control may be set", "code": 400}})
    with patch.object(ai.gemini, "generate", return_value=(None, 1, "provider_busy")) as gemini, \
         patch.object(ai.httpx, "post", return_value=rejected) as request:
        ai.generate("system", CONTEXT)
        assert request.call_count == 2
        gemini.assert_called_once()
    assert ai.trace()["openrouter"] == "invalid_output"
    assert ai.trace()["openrouter"] != "unavailable"


def test_blank_model_settings_use_provider_defaults(monkeypatch):
    keys(monkeypatch)
    for provider in ai.PROVIDERS:
        monkeypatch.setenv(provider.upper() + "_MODEL", "")
    with patch.object(ai.httpx, "post", return_value=reply()) as request:
        ai.chat("openrouter", "system", CONTEXT, 12)
        assert request.call_args.kwargs["json"]["model"] == "openrouter/free"
        ai.chat("groq", "system", CONTEXT, 12)
        assert request.call_args.kwargs["json"]["model"] == "openai/gpt-oss-20b"


def test_blank_gemini_model_uses_default(monkeypatch):
    keys(monkeypatch)
    monkeypatch.setenv("GEMINI_MODEL", "")
    response = httpx.Response(200, request=httpx.Request("POST", "https://generativelanguage.googleapis.com"),
                              json={"candidates": [{"content": {"parts": [{"text": TEXT}]}}]})
    with patch.object(ai.gemini.httpx, "post", return_value=response) as request:
        assert ai.gemini.generate("system", CONTEXT) == (TEXT, 1, "complete")
    assert "/gemini-3.5-flash-lite:generateContent" in request.call_args.args[0]


def test_other_groq_models_do_not_receive_unsupported_reasoning_setting(monkeypatch):
    keys(monkeypatch)
    monkeypatch.setenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    with patch.object(ai.httpx, "post", return_value=reply()) as request:
        ai.chat("groq", "system", CONTEXT, 12)
        assert "reasoning_effort" not in request.call_args.kwargs["json"]
        assert "include_reasoning" not in request.call_args.kwargs["json"]


def test_workflow_reports_openrouter_success_without_calling_backups(monkeypatch):
    from fastapi.testclient import TestClient
    from backend.app.main import app
    keys(monkeypatch)
    client = TestClient(app)
    with patch("backend.app.agent.workflow.research", return_value=([], 0, "not_configured")), \
         patch.object(ai.gemini, "generate") as gemini, \
         patch.object(ai.httpx, "post", return_value=reply()) as request:
        result = client.post("/api/analyse", json=client.get("/api/demo").json()).json()
        assert request.call_count == 1
    gemini.assert_not_called()
    assert result["research_status"]["gemini"] == "not_requested"
    assert result["research_status"]["groq"] == "not_requested"
    assert result["research_status"]["openrouter"] == "complete"
    assert result["research_status"]["explanation_provider"] == "openrouter"
    assert result["periods"]["40"]["explanation"][-1] == TEXT


def test_all_provider_failures_keep_python_calculated_explanation(monkeypatch):
    from backend.app.services.explanation import explain
    keys(monkeypatch)
    failure = httpx.Response(429, request=httpx.Request("POST", "https://provider.test"))
    with patch.object(ai.gemini, "generate", return_value=(None, 1, "quota_reached")), \
         patch.object(ai.httpx, "post", side_effect=[failure, failure]) as request:
        explanation, calls, status = explain({
            "component_savings": {"insulation": 100},
            "savings_aud": 100,
            "years": 40,
            "sustainable": {"total_lcc": 900},
            "conventional": {"total_lcc": 1000},
            "capital_difference": 50,
            "break_even_year": 10,
            "reversal_years": [],
        }, evidence=[])

    assert request.call_count == 2
    assert calls == 3
    assert status == "quota_reached"
    assert len(explanation) == 4
    assert "AUD $1,000" in explanation[0]
    assert ai.trace()["explanation_provider"] == "calculated"
    assert ai.trace()["openrouter"] == "quota_reached"
    assert ai.trace()["groq"] == "quota_reached"
    assert ai.trace()["gemini"] == "quota_reached"


def test_timeout_and_empty_backups_finish_with_calculated_fallback(monkeypatch):
    keys(monkeypatch)
    with patch.object(ai.gemini, "generate", return_value=(None, 1, "unavailable")), patch.object(ai.httpx, "post", side_effect=[httpx.ReadTimeout("timed out"), reply("")]):
        assert ai.generate("system", CONTEXT) == (None, 3, "unavailable")
    assert ai.trace()["explanation_provider"] == "calculated"
    assert ai.trace()["groq"] == "empty_response"
