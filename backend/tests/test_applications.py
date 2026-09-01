"""Tests for /applications CRUD endpoints using in-memory SQLite.

After Phase 2.5 (per-user scoping), every protected endpoint requires a
valid JWT.  Each test therefore registers a user and logs in via the
fixtures below, then passes the token in the Authorization header.
"""

from datetime import date, datetime
from uuid import uuid4
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


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
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


@pytest.fixture()
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


@pytest.fixture()
def user_token(client):
    """Register a test user and return their JWT token."""
    # UUID guarantees uniqueness across tests and parallel invocations
    email = f"user_{uuid4().hex[:8]}@test.com"
    client.post(
        "/auth/register",
        json={"email": email, "password": "testpass123"},
    )

    # Login
    response = client.post(
        "/auth/login",
        data={"username": email, "password": "testpass123"},
    )
    return response.json()["access_token"]


@pytest.fixture()
def auth_headers(user_token):
    """Convenience fixture: returns the Authorization header dict."""
    return {"Authorization": f"Bearer {user_token}"}



# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestCreateApplication:
    """POST /applications"""

    def test_create_application_returns_201(self, client, auth_headers):
        """Verify 201 status code and server-set id and created_at."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
            "status": "applied",
            "job_link": "https://acme.jobs/se",
            "notes": "Good fit for the team",
            "date_applied": "2026-07-20",
        }

        response = client.post("/applications", json=payload, headers=auth_headers)

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

    def test_create_application_date_applied_defaults_to_today(self, client, auth_headers):
        """When date_applied is omitted, server fills today."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
        }

        response = client.post("/applications", json=payload, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["date_applied"] == date.today().isoformat()

    def test_create_application_status_defaults_to_applied(self, client, auth_headers):
        """When status is omitted, defaults to 'applied'."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
        }

        response = client.post("/applications", json=payload, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "applied"

    def test_create_application_requires_auth(self, client):
        """Creating an application without a token returns 401."""
        payload = {"company": "Acme Corp", "role": "Engineer"}
        response = client.post("/applications", json=payload)
        assert response.status_code == 401


class TestListApplications:
    """GET /applications"""

    def test_list_applications_returns_created_items(self, client, auth_headers):
        """List returns all created applications for this user."""
        # Create two applications
        app1 = {"company": "Acme Corp", "role": "Senior Engineer"}
        app2 = {"company": "TechCo", "role": "DevOps Engineer"}

        res1 = client.post("/applications", json=app1, headers=auth_headers)
        res2 = client.post("/applications", json=app2, headers=auth_headers)

        id1 = res1.json()["id"]
        id2 = res2.json()["id"]

        # List them
        response = client.get("/applications", headers=auth_headers)

        assert response.status_code == 200
        items = response.json()
        assert len(items) == 2

        # Both should be in the list
        ids = {item["id"] for item in items}
        assert id1 in ids
        assert id2 in ids

    def test_list_applications_empty_database(self, client, auth_headers):
        """List returns empty array when user has no applications."""
        response = client.get("/applications", headers=auth_headers)

        assert response.status_code == 200
        assert response.json() == []

    def test_list_applications_requires_auth(self, client):
        """Listing without a token returns 401."""
        response = client.get("/applications")
        assert response.status_code == 401


class TestGetApplicationById:
    """GET /applications/{application_id}"""

    def test_get_application_by_id_returns_200(self, client, auth_headers):
        """Fetching an existing application returns 200."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
            "notes": "Great culture",
        }

        create_response = client.post(
            "/applications", json=payload, headers=auth_headers
        )
        app_id = create_response.json()["id"]

        response = client.get(f"/applications/{app_id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == app_id
        assert data["company"] == "Acme Corp"
        assert data["notes"] == "Great culture"

    def test_get_application_missing_id_returns_404(self, client, auth_headers):
        """Fetching a non-existent application returns 404."""
        response = client.get("/applications/99999", headers=auth_headers)

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_application_requires_auth(self, client):
        """Fetching without a token returns 401."""
        response = client.get("/applications/1")
        assert response.status_code == 401


class TestUpdateApplication:
    """PATCH /applications/{application_id}"""

    def test_patch_with_only_status_leaves_notes_and_job_link_intact(
        self, client, auth_headers
    ):
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

        create_response = client.post(
            "/applications", json=payload, headers=auth_headers
        )
        app_id = create_response.json()["id"]

        # Patch only the status
        update_payload = {"status": "interviewing"}
        response = client.patch(
            f"/applications/{app_id}", json=update_payload, headers=auth_headers
        )

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

    def test_patch_updates_multiple_fields(self, client, auth_headers):
        """Can update multiple fields at once."""
        payload = {
            "company": "Acme Corp",
            "role": "Software Engineer",
            "status": "applied",
        }

        create_response = client.post(
            "/applications", json=payload, headers=auth_headers
        )
        app_id = create_response.json()["id"]

        # Update multiple fields
        update_payload = {"status": "offer", "notes": "Accepted offer!"}
        response = client.patch(
            f"/applications/{app_id}", json=update_payload, headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "offer"
        assert data["notes"] == "Accepted offer!"
        assert data["company"] == "Acme Corp"  # unchanged

    def test_patch_missing_id_returns_404(self, client, auth_headers):
        """Patching a non-existent application returns 404."""
        response = client.patch(
            "/applications/99999", json={"status": "offer"}, headers=auth_headers
        )

        assert response.status_code == 404

    def test_patch_requires_auth(self, client):
        """Patching without a token returns 401."""
        response = client.patch("/applications/1", json={"status": "offer"})
        assert response.status_code == 401


class TestDeleteApplication:
    """DELETE /applications/{application_id}"""

    def test_delete_application_returns_204(self, client, auth_headers):
        """Successful delete returns 204 No Content."""
        payload = {"company": "Acme Corp", "role": "Software Engineer"}

        create_response = client.post(
            "/applications", json=payload, headers=auth_headers
        )
        app_id = create_response.json()["id"]

        response = client.delete(f"/applications/{app_id}", headers=auth_headers)

        assert response.status_code == 204
        assert response.text == ""  # 204 has no body

    def test_delete_application_then_get_returns_404(self, client, auth_headers):
        """After deletion, the row is gone."""
        payload = {"company": "Acme Corp", "role": "Software Engineer"}

        create_response = client.post(
            "/applications", json=payload, headers=auth_headers
        )
        app_id = create_response.json()["id"]

        # Delete it
        client.delete(f"/applications/{app_id}", headers=auth_headers)

        # Try to fetch it
        response = client.get(f"/applications/{app_id}", headers=auth_headers)

        assert response.status_code == 404

    def test_delete_missing_id_returns_404(self, client, auth_headers):
        """Deleting a non-existent application returns 404."""
        response = client.delete("/applications/99999", headers=auth_headers)

        assert response.status_code == 404

    def test_delete_requires_auth(self, client):
        """Deleting without a token returns 401."""
        response = client.delete("/applications/1")
        assert response.status_code == 401


class TestUserIsolation:
    """Cross-user isolation: user A cannot see/modify user B's data."""

    def _register_and_login(self, client, email):
        """Helper: register a user and return their token."""
        client.post(
            "/auth/register",
            json={"email": email, "password": "testpass123"},
        )
        response = client.post(
            "/auth/login",
            data={"username": email, "password": "testpass123"},
        )
        return response.json()["access_token"]

    def test_user_a_cannot_see_user_b_applications(self, client):
        """List only returns the current user's applications."""
        token_a = self._register_and_login(client, "alice@test.com")
        token_b = self._register_and_login(client, "bob@test.com")

        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Alice creates an application
        client.post(
            "/applications",
            json={"company": "Acme", "role": "Engineer"},
            headers=headers_a,
        )

        # Bob creates a different application
        client.post(
            "/applications",
            json={"company": "TechCo", "role": "DevOps"},
            headers=headers_b,
        )

        # Each sees only their own
        list_a = client.get("/applications", headers=headers_a).json()
        list_b = client.get("/applications", headers=headers_b).json()

        assert len(list_a) == 1
        assert list_a[0]["company"] == "Acme"

        assert len(list_b) == 1
        assert list_b[0]["company"] == "TechCo"

    def test_user_a_cannot_fetch_user_b_application(self, client):
        """GET by id returns 404 if the application belongs to another user."""
        token_a = self._register_and_login(client, "alice2@test.com")
        token_b = self._register_and_login(client, "bob2@test.com")

        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Bob creates an application
        resp = client.post(
            "/applications",
            json={"company": "TechCo", "role": "DevOps"},
            headers=headers_b,
        )
        bob_app_id = resp.json()["id"]

        # Alice tries to fetch Bob's application — gets 404
        response = client.get(
            f"/applications/{bob_app_id}", headers=headers_a
        )
        assert response.status_code == 404

    def test_user_a_cannot_update_user_b_application(self, client):
        """PATCH returns 404 if the application belongs to another user."""
        token_a = self._register_and_login(client, "alice3@test.com")
        token_b = self._register_and_login(client, "bob3@test.com")

        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Bob creates an application
        resp = client.post(
            "/applications",
            json={"company": "TechCo", "role": "DevOps"},
            headers=headers_b,
        )
        bob_app_id = resp.json()["id"]

        # Alice tries to patch Bob's application — gets 404
        response = client.patch(
            f"/applications/{bob_app_id}",
            json={"status": "offer"},
            headers=headers_a,
        )
        assert response.status_code == 404

    def test_user_a_cannot_delete_user_b_application(self, client):
        """DELETE returns 404 if the application belongs to another user."""
        token_a = self._register_and_login(client, "alice4@test.com")
        token_b = self._register_and_login(client, "bob4@test.com")

        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Bob creates an application
        resp = client.post(
            "/applications",
            json={"company": "TechCo", "role": "DevOps"},
            headers=headers_b,
        )
        bob_app_id = resp.json()["id"]

        # Alice tries to delete Bob's application — gets 404
        response = client.delete(
            f"/applications/{bob_app_id}", headers=headers_a
        )
        assert response.status_code == 404

        # Confirm Bob's application still exists
        response = client.get(
            f"/applications/{bob_app_id}", headers=headers_b
        )
        assert response.status_code == 200
        assert response.json()["company"] == "TechCo"


class TestHealthEndpoint:
    """GET /health (sanity check)"""

    def test_health_returns_ok(self, client):
        """Health endpoint returns ok status (no auth required)."""
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
