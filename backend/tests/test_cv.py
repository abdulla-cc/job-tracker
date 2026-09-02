"""Tests for BaseCV endpoints and CV tailoring logic.

Tests the /cv CRUD and /tailor-cv endpoint with mocked Groq calls.
"""

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from sqlmodel.pool import StaticPool

from main import app
from database import get_session
from dependencies import get_current_user
from models import BaseCV, User


# --- Fixtures ---

SAMPLE_CV = {
    "full_name": "Abdullah",
    "email": "abdullah@example.com",
    "phone": "+60123456789",
    "education": json.dumps([
        {"school": "Multimedia University", "degree": "BSc Computer Science (AI)", "dates": "2023-2027"}
    ]),
    "skills": json.dumps(["Python", "FastAPI", "SQL", "Docker", "Git"]),
    "experience": json.dumps([
        {
            "title": "Research Agent Developer",
            "company": "Personal Project",
            "bullets": [
                "Built a full RAG pipeline with FastAPI",
                "Deployed on Render with Docker",
            ],
        }
    ]),
    "projects": json.dumps([
        {
            "name": "Research Agent",
            "description": "Agentic RAG system",
            "bullets": ["arXiv API integration", "16 pytest tests"],
        }
    ]),
}

SAMPLE_JD = (
    "Senior Python Developer. Requirements: Python, FastAPI, SQL, Docker, "
    "3+ years experience. Nice to have: CI/CD, Kubernetes, Redis."
)


@pytest.fixture(name="client")
def client_fixture():
    """Create a test client with in-memory SQLite."""
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(test_engine)

    def test_session():
        with Session(test_engine) as s:
            yield s

    def test_get_user():
        return User(id=1, email="test@example.com", hashed_password="x")

    app.dependency_overrides[get_session] = test_session
    app.dependency_overrides[get_current_user] = test_get_user

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


# --- /cv endpoint tests ---


class TestBaseCV:
    """Tests for POST /cv and GET /cv."""

    def test_save_cv_returns_201(self, client):
        resp = client.post("/cv", json=SAMPLE_CV)
        assert resp.status_code == 201
        data = resp.json()
        assert data["full_name"] == "Abdullah"
        assert data["email"] == "abdullah@example.com"
        assert "id" in data

    def test_get_cv_returns_200(self, client):
        client.post("/cv", json=SAMPLE_CV)
        resp = client.get("/cv")
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Abdullah"

    def test_get_cv_without_saving_returns_404(self, client):
        resp = client.get("/cv")
        assert resp.status_code == 404

    def test_save_cv_twice_upserts(self, client):
        """POST /cv twice should update, not create a second row."""
        resp1 = client.post("/cv", json=SAMPLE_CV)
        assert resp1.status_code == 201
        id1 = resp1.json()["id"]

        updated = {**SAMPLE_CV, "full_name": "Abdullah Updated"}
        resp2 = client.post("/cv", json=updated)
        assert resp2.status_code == 201
        assert resp2.json()["id"] == id1  # same ID
        assert resp2.json()["full_name"] == "Abdullah Updated"

    def test_cv_requires_auth(self, client):
        app.dependency_overrides.clear()
        resp = client.post("/cv", json=SAMPLE_CV)
        assert resp.status_code == 401

    def test_get_cv_requires_auth(self, client):
        app.dependency_overrides.clear()
        resp = client.get("/cv")
        assert resp.status_code == 401


# --- /tailor-cv endpoint tests ---


class TestTailorCV:
    """Tests for POST /tailor-cv with mocked Groq."""

    def _mock_groq_response(self, content: str) -> MagicMock:
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = content
        return mock_response

    def test_tailor_without_cv_returns_400(self, client):
        resp = client.post("/tailor-cv", json={"job_description": SAMPLE_JD})
        assert resp.status_code == 400
        assert "Save your base CV first" in resp.json()["detail"]

    @patch("ai_service.client")
    def test_tailor_success(self, mock_client, client):
        tailored = json.dumps({
            "summary": "Python developer with FastAPI experience, applying for senior role.",
            "skills": ["FastAPI", "Python", "SQL", "Docker", "Git"],
            "experience": [
                {
                    "title": "Research Agent Developer",
                    "company": "Personal Project",
                    "bullets": [
                        "Designed and built RESTful APIs using FastAPI with authentication",
                        "Containerized application with Docker and deployed to cloud",
                    ],
                }
            ],
            "projects": [
                {
                    "name": "Research Agent",
                    "description": "Agentic RAG system",
                    "bullets": ["Built production FastAPI service", "Implemented 16 automated tests"],
                }
            ],
        })
        mock_client.chat.completions.create.return_value = self._mock_groq_response(tailored)

        # Save CV first
        client.post("/cv", json=SAMPLE_CV)

        # Then tailor
        resp = client.post("/tailor-cv", json={"job_description": SAMPLE_JD})
        assert resp.status_code == 200
        data = resp.json()
        assert "summary" in data
        assert "skills" in data
        assert "experience" in data
        assert "projects" in data
        assert isinstance(data["skills"], list)
        assert isinstance(data["experience"], list)

    @patch("ai_service.client")
    def test_tailor_reorders_skills(self, mock_client, client):
        """Skills relevant to the JD should come first."""
        tailored = json.dumps({
            "summary": "Match.",
            "skills": ["FastAPI", "Python", "SQL", "Docker", "Git"],
            "experience": [{"title": "Dev", "company": "Co", "bullets": ["Did stuff"]}],
            "projects": [{"name": "P", "description": "D", "bullets": ["B"]}],
        })
        mock_client.chat.completions.create.return_value = self._mock_groq_response(tailored)

        client.post("/cv", json=SAMPLE_CV)
        resp = client.post("/tailor-cv", json={"job_description": SAMPLE_JD})
        skills = resp.json()["skills"]
        # FastAPI and Python should be first for a Python/FastAPI role
        assert skills[0] in ["FastAPI", "Python"]

    @patch("ai_service.client")
    def test_tailor_groq_error_returns_503(self, mock_client, client):
        mock_client.chat.completions.create.side_effect = Exception("Rate limited")

        client.post("/cv", json=SAMPLE_CV)
        resp = client.post("/tailor-cv", json={"job_description": SAMPLE_JD})
        assert resp.status_code == 503

    @patch("ai_service.client")
    def test_tailor_malformed_response_returns_422(self, mock_client, client):
        mock_client.chat.completions.create.return_value = self._mock_groq_response(
            "Here is the tailored CV: {not valid json"
        )

        client.post("/cv", json=SAMPLE_CV)
        resp = client.post("/tailor-cv", json={"job_description": SAMPLE_JD})
        assert resp.status_code == 422

    def test_tailor_requires_auth(self, client):
        app.dependency_overrides.clear()
        resp = client.post("/tailor-cv", json={"job_description": SAMPLE_JD})
        assert resp.status_code == 401
