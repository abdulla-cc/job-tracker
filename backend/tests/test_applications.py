"""Tests for /applications CRUD endpoints using in-memory SQLite."""

from datetime import date, datetime
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool
from fastapi.testclient import TestClient
import pytest

import sys
from pathlib import Path

# Add parent dir so we can import main, models, database
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app
from database import get_session
from models import Application


@pytest.fixture
def session_override():
    """Create an in-memory SQLite database for tests.

    Yields a Session that each test uses.
    After the test, the session is closed and the database is torn down.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


@pytest.fixture
def client(session_override):
    """Override app's get_session dependency with our test session.

    After the test, restore the original dependency.
    """
    def get_session_override():
        return session_override

    app.dependency_overrides[get_session] = get_session_override

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


class TestCreateApplication:
    """POST /applications"""

    def test_create_application_returns_201(self, client, session_override):
        """Verify 201 status code and server-set id and created_at."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
            "status": "applied",
            "job_link": "https://acme.jobs/se",
            "notes": "Good fit for the team",
            "date_applied": "2026-07-20",
        }

        response = client.post("/applications", json=payload)

        assert response.status_code == 201
        data = response.json()

        # Server-set fields: id and created_at should be populated
        assert data["id"] is not None
        assert isinstance(data["id"], int)
        assert data["id"] > 0

        assert data["created_at"] is not None
        # created_at should parse as a valid ISO datetime string
        created_at = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
        assert isinstance(created_at, datetime)

        # Echo back the sent fields
        assert data["company"] == "Acme Corp"
        assert data["role"] == "Software Engineer"
        assert data["status"] == "applied"
        assert data["job_link"] == "https://acme.jobs/se"
        assert data["notes"] == "Good fit for the team"
        assert data["date_applied"] == "2026-07-20"

    def test_create_application_date_applied_defaults_to_today(self, client):
        """When date_applied is omitted, server fills today."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
        }

        response = client.post("/applications", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["date_applied"] == date.today().isoformat()

    def test_create_application_status_defaults_to_applied(self, client):
        """When status is omitted, defaults to 'applied'."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
        }

        response = client.post("/applications", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "applied"


class TestListApplications:
    """GET /applications"""

    def test_list_applications_returns_created_items(self, client):
        """List returns all created applications."""
        # Create two applications
        app1 = {
            "company": "Acme Corp",
            "role": "Senior Engineer",
        }
        app2 = {
            "company": "TechCo",
            "role": "DevOps Engineer",
        }

        res1 = client.post("/applications", json=app1)
        res2 = client.post("/applications", json=app2)

        id1 = res1.json()["id"]
        id2 = res2.json()["id"]

        # List them
        response = client.get("/applications")

        assert response.status_code == 200
        items = response.json()
        assert len(items) == 2

        # Both should be in the list
        ids = {item["id"] for item in items}
        assert id1 in ids
        assert id2 in ids

    def test_list_applications_empty_database(self, client):
        """List returns empty array when no applications exist."""
        response = client.get("/applications")

        assert response.status_code == 200
        assert response.json() == []


class TestGetApplicationById:
    """GET /applications/{application_id}"""

    def test_get_application_by_id_returns_200(self, client):
        """Fetching an existing application returns 200."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
            "notes": "Great culture",
        }

        create_response = client.post("/applications", json=payload)
        app_id = create_response.json()["id"]

        response = client.get(f"/applications/{app_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == app_id
        assert data["company"] == "Acme Corp"
        assert data["notes"] == "Great culture"

    def test_get_application_missing_id_returns_404(self, client):
        """Fetching a non-existent application returns 404."""
        response = client.get("/applications/99999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestUpdateApplication:
    """PATCH /applications/{application_id}"""

    def test_patch_with_only_status_leaves_notes_and_job_link_intact(self, client):
        """Partial update: only status changes, other fields persist."""
        # Create with all fields
        payload = {
            "company": "Acme Corp",
            "role": "Senior Engineer",
            "status": "applied",
            "job_link": "https://acme.jobs/se",
            "notes": "Good fit, follow up next week",
            "date_applied": "2026-07-20",
        }

        create_response = client.post("/applications", json=payload)
        app_id = create_response.json()["id"]

        # Patch only the status
        update_payload = {"status": "interviewing"}
        response = client.patch(f"/applications/{app_id}", json=update_payload)

        assert response.status_code == 200
        data = response.json()

        # Status changed
        assert data["status"] == "interviewing"

        # Everything else unchanged
        assert data["company"] == "Acme Corp"
        assert data["role"] == "Senior Engineer"
        assert data["job_link"] == "https://acme.jobs/se"
        assert data["notes"] == "Good fit, follow up next week"
        assert data["date_applied"] == "2026-07-20"

    def test_patch_updates_multiple_fields(self, client):
        """Can update multiple fields at once."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
            "status": "applied",
        }

        create_response = client.post("/applications", json=payload)
        app_id = create_response.json()["id"]

        # Update multiple fields
        update_payload = {
            "status": "offer",
            "notes": "Accepted offer!",
        }
        response = client.patch(f"/applications/{app_id}", json=update_payload)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "offer"
        assert data["notes"] == "Accepted offer!"
        assert data["company"] == "Acme Corp"  # unchanged

    def test_patch_missing_id_returns_404(self, client):
        """Patching a non-existent application returns 404."""
        response = client.patch("/applications/99999", json={"status": "offer"})

        assert response.status_code == 404


class TestDeleteApplication:
    """DELETE /applications/{application_id}"""

    def test_delete_application_returns_204(self, client):
        """Successful delete returns 204 No Content."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
        }

        create_response = client.post("/applications", json=payload)
        app_id = create_response.json()["id"]

        response = client.delete(f"/applications/{app_id}")

        assert response.status_code == 204
        assert response.text == ""  # 204 has no body

    def test_delete_application_then_get_returns_404(self, client):
        """After deletion, the row is gone."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
        }

        create_response = client.post("/applications", json=payload)
        app_id = create_response.json()["id"]

        # Delete it
        client.delete(f"/applications/{app_id}")

        # Try to fetch it
        response = client.get(f"/applications/{app_id}")

        assert response.status_code == 404

    def test_delete_missing_id_returns_404(self, client):
        """Deleting a non-existent application returns 404."""
        response = client.delete("/applications/99999")

        assert response.status_code == 404


class TestHealthEndpoint:
    """GET /health (sanity check)"""

    def test_health_returns_ok(self, client):
        """Health endpoint returns ok status."""
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
