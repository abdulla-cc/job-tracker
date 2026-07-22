# Job Application Tracker

A full-stack app for tracking job applications, with an AI feature that analyses
job descriptions against my CV. Built while job-hunting as a final-year CS (AI) student.

**Status:** in development. Phase 1 (backend data layer + CRUD) complete.

## Stack

| Layer | Choice | Why |
|---|---|---|
| API | FastAPI | Type-driven validation, auto-generated OpenAPI docs |
| ORM | SQLModel | Models and API schemas in one type system; Postgres-ready |
| DB | SQLite | Zero-config for a single-user MVP; swappable via `DATABASE_URL` |
| Auth | JWT + Argon2 | Stateless API, memory-hard password hashing |
| AI | Groq (Llama 3.1 8B) | Fast inference for job-description analysis |
| Frontend | React (Vite) | Planned |

## API

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| POST | `/applications` | Create an application |
| GET | `/applications` | List applications |
| GET | `/applications/{id}` | Get one |
| PATCH | `/applications/{id}` | Partial update |
| DELETE | `/applications/{id}` | Delete |

Interactive docs at `/docs` when running.

## Running locally

```bash
cd backend
python -m venv venv
source venv/Scripts/activate      # Windows: Git Bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Then open http://127.0.0.1:8000/docs

## Tests

```bash
cd backend && pytest -v
```

14 tests covering CRUD, using an in-memory SQLite database via FastAPI's
dependency-override mechanism, so tests never touch the development database.

## Design notes

- **API schemas are separate from DB models** (`schemas.py` vs `models.py`) so clients
  cannot set server-controlled fields such as `id`, `created_at`, or `user_id`.
- **PATCH uses `exclude_unset`** so partial updates don't null out unsent fields.
- **Passwords are hashed with Argon2id**, never stored or logged in plaintext.

## Roadmap

- [x] Phase 1 — data layer, CRUD, tests
- [ ] Phase 2 — auth (registration, login, JWT, per-user scoping)
- [ ] Phase 3 — AI job-description analysis
- [ ] Phase 4 — React frontend
- [ ] Phase 5 — Docker + deployment
