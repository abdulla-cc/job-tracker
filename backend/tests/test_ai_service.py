"""Tests for ai_service.py — mock-based, no real Groq calls.

Tests the parsing, validation, and error-handling logic of the AI module
without hitting the external API. Fast, deterministic, free.
"""

import json
from unittest.mock import MagicMock, patch

import pytest

from ai_service import (
    _parse_json_response,
    _validate_structure,
    analyze,
)


# --- _validate_structure tests ---


class TestValidateStructure:
    """Unit tests for the structure validator."""

    def test_valid_structure(self):
        result = {
            "requirements": ["Python", "SQL"],
            "nice_to_haves": ["Docker"],
            "fit_score": 75,
            "fit_reasoning": "Strong match.",
            "emphasize": ["RAG pipeline"],
        }
        assert _validate_structure(result) is True

    def test_missing_key_returns_false(self):
        result = {
            "requirements": ["Python"],
            "nice_to_haves": [],
            "fit_score": 50,
            "fit_reasoning": "OK.",
            # missing "emphasize"
        }
        assert _validate_structure(result) is False

    def test_wrong_type_returns_false(self):
        result = {
            "requirements": "Python",       # should be list, is string
            "nice_to_haves": [],
            "fit_score": 50,
            "fit_reasoning": "OK.",
            "emphasize": [],
        }
        assert _validate_structure(result) is False

    def test_fit_score_out_of_range_returns_false(self):
        result = {
            "requirements": [],
            "nice_to_haves": [],
            "fit_score": 150,               # must be 0-100
            "fit_reasoning": "OK.",
            "emphasize": [],
        }
        assert _validate_structure(result) is False

    def test_fit_score_negative_returns_false(self):
        result = {
            "requirements": [],
            "nice_to_haves": [],
            "fit_score": -10,
            "fit_reasoning": "OK.",
            "emphasize": [],
        }
        assert _validate_structure(result) is False

    def test_empty_dict_returns_false(self):
        assert _validate_structure({}) is False

    def test_float_fit_score_in_range_is_valid(self):
        result = {
            "requirements": [],
            "nice_to_haves": [],
            "fit_score": 72.5,
            "fit_reasoning": "OK.",
            "emphasize": [],
        }
        assert _validate_structure(result) is True


# --- _parse_json_response tests ---


class TestParseJsonResponse:
    """Tests for the JSON extraction and fallback logic."""

    VALID_JSON = json.dumps({
        "requirements": ["Python"],
        "nice_to_haves": [],
        "fit_score": 80,
        "fit_reasoning": "Good match.",
        "emphasize": ["FastAPI experience"],
    })

    def test_clean_json_parses_directly(self):
        result = _parse_json_response(self.VALID_JSON)
        assert result["fit_score"] == 80
        assert "error" not in result

    def test_json_wrapped_in_text_extracts_correctly(self):
        wrapped = f"Here is the analysis:\n{self.VALID_JSON}\nHope that helps!"
        result = _parse_json_response(wrapped)
        assert result["fit_score"] == 80
        assert "error" not in result

    def test_completely_garbage_returns_error(self):
        result = _parse_json_response("This is not JSON at all. Just words.")
        assert result["error"] == "analysis_unavailable"
        assert result["raw_response"] is not None

    def test_empty_string_returns_error(self):
        result = _parse_json_response("")
        assert result["error"] == "analysis_unavailable"
        assert result["raw_response"] is None

    def test_valid_json_wrong_structure_falls_back(self):
        """JSON is valid but missing required keys — should fail validation."""
        wrong_structure = json.dumps({"answer": "yes", "score": 90})
        result = _parse_json_response(wrong_structure)
        assert result["error"] == "analysis_unavailable"

    def test_truncated_json_falls_back(self):
        truncated = '{"requirements": ["Python"], "nice_to_haves": [], "fit_score":'
        result = _parse_json_response(truncated)
        assert result["error"] == "analysis_unavailable"


# --- analyze() with mocked Groq ---


class TestAnalyzeMocked:
    """Integration-style tests that mock the Groq API call."""

    def _mock_groq_response(self, content: str) -> MagicMock:
        """Create a mock Groq response object."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = content
        return mock_response

    @patch("ai_service.client")
    def test_successful_analysis(self, mock_client):
        valid = json.dumps({
            "requirements": ["Python", "FastAPI"],
            "nice_to_haves": ["Docker"],
            "fit_score": 70,
            "fit_reasoning": "Decent match.",
            "emphasize": ["Built RAG pipeline"],
        })
        mock_client.chat.completions.create.return_value = self._mock_groq_response(valid)

        result = analyze("Looking for a Python developer with FastAPI experience.")

        assert result["fit_score"] == 70
        assert "Python" in result["requirements"]
        assert "error" not in result
        mock_client.chat.completions.create.assert_called_once()

    @patch("ai_service.client")
    def test_groq_api_error_returns_error_dict(self, mock_client):
        mock_client.chat.completions.create.side_effect = Exception("Rate limit exceeded")

        result = analyze("Some job description that is long enough to pass validation.")

        assert result["error"] == "groq_api_error"
        assert "Rate limit exceeded" in result["detail"]

    @patch("ai_service.client")
    def test_malformed_json_returns_fallback(self, mock_client):
        mock_client.chat.completions.create.return_value = self._mock_groq_response(
            "Sure! Here's the analysis:\n{not valid json\n"
        )

        result = analyze("Another job description for testing purposes here.")

        assert result["error"] == "analysis_unavailable"
        assert result["raw_response"] is not None

    @patch("ai_service.client")
    def test_wrong_structure_json_returns_fallback(self, mock_client):
        """LLM returns valid JSON but in the wrong shape."""
        wrong = json.dumps({"answer": "yes", "score": 99})
        mock_client.chat.completions.create.return_value = self._mock_groq_response(wrong)

        result = analyze("Job description that is long enough to pass the min length check.")

        assert result["error"] == "analysis_unavailable"

    @patch("ai_service.client")
    def test_groq_returns_none_content(self, mock_client):
        """Edge case: Groq returns a response with None content."""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = None
        mock_client.chat.completions.create.return_value = mock_response

        result = analyze("Job description text that is definitely long enough to pass.")

        assert result["error"] == "analysis_unavailable"
