"""AI service — wraps Groq for job-description analysis.

The frontend never sees GROQ_API_KEY; it calls POST /analyze on our backend,
and this module makes the Groq call server-side.
"""

import json
import os
import re

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# --- Candidate profile (hardcoded for now; could become a DB field later) ---
CANDIDATE_PROFILE = {
    "name": "Abdullah",
    "education": "BSc Computer Science (AI), Multimedia University, Melaka, Malaysia. GPA 3.4, Dean's List. Graduating ~March 2027.",
    "skills": [
        "Python", "FastAPI", "SQLModel", "SQLite", "SQL",
        "REST APIs", "JWT authentication", "pytest",
        "RAG pipelines", "semantic chunking", "vector databases",
        "Groq / Llama 3.3 70B", "Docker", "Git",
    ],
    "experience": [
        "Research Agent — Agentic RAG System: full RAG pipeline (arXiv API, PDF extraction, embeddings, Chroma, retrieval), agentic query decomposition + critic, FastAPI service with validation/logging/retry, 16 pytest tests, Dockerized, deployed on Render.",
    ],
    "positioning": "Entry-level AI/ML Engineer or Backend Engineer. Strong Python + API skills. Real deployment experience. Learning React (not yet on CV).",
}

SYSTEM_PROMPT = """You are a senior career advisor AI. Given a candidate profile and a job description, produce a structured JSON analysis.

Return ONLY valid JSON — no markdown fences, no explanation text before or after.

JSON structure:
{
  "requirements": ["skill or requirement extracted from the JD, e.g. 'Python', '3+ years experience', 'AWS']",
  "nice_to_haves": ["optional or preferred requirements, e.g. 'Docker', 'CI/CD experience']",
  "fit_score": 75,
  "fit_reasoning": "One paragraph explaining why this score — what matches, what's missing, honest assessment.",
  "emphasize": ["Which bullets from the candidate's profile to highlight in a cover letter or interview, e.g. 'Built RAG pipeline deployed on Render'"]
}

Rules:
- fit_score is an integer 0-100.
- requirements and nice_to_haves are extracted FROM the job description, not invented.
- emphasize references specific items from the candidate's profile.
- Be honest. If the fit is weak, say so — a low score with actionable advice is more useful than a inflated score.
- Keep fit_reasoning to 2-4 sentences.
"""

# Regex to extract JSON from text that may contain surrounding prose
_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


def analyze(job_description: str) -> dict:
    """Analyze a job description against the candidate profile.

    Returns the structured analysis dict on success.
    On any failure, returns a structured error dict — never raises.
    """
    user_message = (
        f"## Candidate Profile\n{json.dumps(CANDIDATE_PROFILE, indent=2)}\n\n"
        f"## Job Description\n{job_description}"
    )

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,       # low temperature = more consistent JSON
            max_tokens=1024,
        )
        raw = response.choices[0].message.content
    except Exception as e:
        return {
            "error": "groq_api_error",
            "detail": str(e),
        }

    # Groq can return None content in edge cases
    if raw is None:
        return {
            "error": "analysis_unavailable",
            "detail": "The AI returned an empty response.",
            "raw_response": None,
        }

    # --- Parse the JSON response ---
    return _parse_json_response(raw)


def _parse_json_response(raw: str) -> dict:
    """Try to parse the LLM response as JSON, with fallback extraction."""

    # Attempt 1: direct parse
    try:
        result = json.loads(raw)
        if _validate_structure(result):
            return result
    except (json.JSONDecodeError, TypeError):
        pass

    # Attempt 2: extract JSON from surrounding text
    match = _JSON_BLOCK_RE.search(raw)
    if match:
        try:
            result = json.loads(match.group())
            if _validate_structure(result):
                return result
        except (json.JSONDecodeError, TypeError):
            pass

    # Attempt 3: graceful degradation
    return {
        "error": "analysis_unavailable",
        "detail": "The AI response could not be parsed. Please try again.",
        "raw_response": raw[:500] if raw else None,
    }


def _validate_structure(result: dict) -> bool:
    """Check that the parsed JSON has the expected keys with correct types."""
    required_keys = {
        "requirements": list,
        "nice_to_haves": list,
        "fit_score": (int, float),
        "fit_reasoning": str,
        "emphasize": list,
    }
    for key, expected_type in required_keys.items():
        if key not in result:
            return False
        if not isinstance(result[key], expected_type):
            return False
    # fit_score must be in range
    if not (0 <= result["fit_score"] <= 100):
        return False
    return True
