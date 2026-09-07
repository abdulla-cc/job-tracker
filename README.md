# Job Application Tracker

A full-stack, AI-powered app for tracking job applications and tailoring CVs. Built while job-hunting as a final-year CS (AI) student. 

**Status:** Phases 1 through 4 complete. The app features a fully working React frontend, secure backend API, and Groq-powered AI analysis.

## 🌟 Key Features

- **Interactive Kanban Board**: Track applications visually from "Applied" to "Offer". Features animated status borders and an empty-state hero dashboard.
- **AI Job Description Matcher**: Paste a job posting and use **Llama 3.1 70B (Groq)** to instantly extract requirements, generate a CV fit score, and get actionable tailoring tips.
- **Modern Warm Aesthetic**: A highly polished UI using a custom beige/brown color palette (`#f5f0eb`, `#8B5E3C`), limelight navigation, animated background grids, and holographic login walls.
- **Secure Authentication**: Built-in registration and login using JWT and Argon2 password hashing.

## 🛠 Stack

| Layer | Choice | Why |
|---|---|---|
| **API** | FastAPI | Type-driven validation, auto-generated OpenAPI docs |
| **ORM** | SQLModel | Models and API schemas in one type system; Postgres-ready |
| **DB** | SQLite | Zero-config for MVP; easily swappable via `DATABASE_URL` |
| **Auth** | JWT + Argon2 | Stateless API, memory-hard password hashing |
| **AI** | Groq (Llama 3.1 70B) | Blazing fast inference for job-description analysis |
| **Frontend** | React 19 + Vite | Fast, modern component rendering |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Utility-first styling with accessible, animated components (Framer Motion) |

## 🚀 Running Locally

You'll need two terminal windows to run both the backend and frontend.

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/Scripts/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
*API runs at `http://127.0.0.1:8000`. Interactive docs at `/docs`.*

### 2. Frontend (React / Vite)

```bash
cd frontend
npm install
npm run dev
```
*App runs at `http://localhost:5173`.*

## 🧪 Tests

```bash
cd backend && pytest -v
```

**53 tests** covering CRUD, authentication, and AI services using an in-memory SQLite database via FastAPI's dependency-override mechanism. Tests never touch your development database.

## 🏗 Design Notes

- **API schemas are separate from DB models** (`schemas.py` vs `models.py`) so clients cannot set server-controlled fields such as `id`, `created_at`, or `user_id`.
- **UI Components** utilize `framer-motion` for complex animations like the moving border beams, which react dynamically to application statuses (e.g., green for 'Offer', warm brown for 'Interviewing').
- **Passwords are hashed with Argon2id**, never stored or logged in plaintext.

## 🗺 Roadmap

- [x] Phase 1 — Data layer, CRUD, tests
- [x] Phase 2 — Auth (registration, login, JWT, per-user scoping)
- [x] Phase 3 — AI job-description analysis (Groq integration)
- [x] Phase 4 — React frontend (Tailwind v4, Kanban board, AI cards)
- [ ] Phase 5 — Docker + deployment
