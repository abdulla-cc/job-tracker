# Job Application Tracker

A full-stack, AI-powered app for tracking job applications and tailoring CVs. Built while job-hunting as a final-year CS (AI) student. 

**Status:** All Phases (1 through 5) complete! The app features a fully working React frontend, secure FastAPI backend, Groq-powered AI analysis, and complete Docker containerization with Render deployment automation.

## 🌟 Key Features

- **Interactive Kanban Board**: Track applications visually from "Applied" to "Offer". Features animated status borders and an empty-state hero dashboard.
- **AI Job Description Matcher**: Paste a job posting and use **Llama 3.1 70B (Groq)** to instantly extract requirements, generate a CV fit score, and get actionable tailoring tips.
- **Modern Warm Aesthetic**: A highly polished UI using a custom beige/brown color palette (`#f5f0eb`, `#8B5E3C`), limelight navigation, animated background grids, and holographic login walls.
- **Secure Authentication**: Built-in registration and login using JWT and Argon2 password hashing.
- **Production-Ready Dockerization**: Multi-stage Nginx container for the frontend with client-side SPA routing, Uvicorn backend with persistent SQLite volume storage, and Render Blueprint Infrastructure as Code.

## 🛠 Stack

| Layer | Choice | Why |
|---|---|---|
| **API** | FastAPI | Type-driven validation, auto-generated OpenAPI docs |
| **ORM** | SQLModel | Models and API schemas in one type system; Postgres-ready |
| **DB** | SQLite / PostgreSQL | Zero-config SQLite for dev/Docker; seamlessly swappable to Postgres for production |
| **Auth** | JWT + Argon2 | Stateless API, memory-hard password hashing |
| **AI** | Groq (Llama 3.1 70B) | Blazing fast inference for job-description analysis |
| **Frontend** | React 19 + Vite | Fast, modern component rendering |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Utility-first styling with accessible, animated components (Framer Motion) |
| **Container** | Docker & Compose | Multi-stage Nginx build + persistent volume storage |
| **Deployment** | Render (Blueprint) | Automated CI/CD with `render.yaml` |

## 🚀 Running Locally

### Option A: Running with Docker Compose (Recommended)

Make sure Docker Desktop is installed and running, then:

```bash
# 1. Create your environment file from template
cp .env.example .env
# Edit .env to add your GROQ_API_KEY and a JWT_SECRET

# 2. Build and start both containers
docker compose up --build
```
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`
- *Your SQLite database is safely persisted in the `backend_data` Docker volume.*

---

### Option B: Running Bare-Metal (Two Terminals)

#### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/Scripts/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
*API runs at `http://127.0.0.1:8000`.*

#### 2. Frontend (React / Vite)

```bash
cd frontend
npm install
npm run dev
```
*App runs at `http://localhost:5173`.*

## ☁️ Deployment (Render)

This repository includes a [`render.yaml`](render.yaml) Blueprint that configures the entire stack in one click:
1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New** &rarr; **Blueprint**.
3. Connect your repository. Render will automatically configure:
   - The FastAPI web service with auto-generated JWT secrets.
   - The React static site with SPA routing and automatic API URL injection.
   - A free managed PostgreSQL database (via SQLModel).
4. Set your `GROQ_API_KEY` under the backend environment variables in Render.

## 🧪 Tests

```bash
cd backend && pytest -v
```

**53 tests** covering CRUD, authentication, and AI services using an in-memory SQLite database via FastAPI's dependency-override mechanism. Tests never touch your development database.

## 🏗 Design Notes

- **API schemas are separate from DB models** (`schemas.py` vs `models.py`) so clients cannot set server-controlled fields such as `id`, `created_at`, or `user_id`.
- **Multi-stage Docker builds** compile React assets in a Node environment, then transfer the lightweight static files to an alpine Nginx web server (~25MB) with SPA fallback routing.
- **Passwords are hashed with Argon2id**, never stored or logged in plaintext.

## 🗺 Roadmap

- [x] Phase 1 — Data layer, CRUD, tests
- [x] Phase 2 — Auth (registration, login, JWT, per-user scoping)
- [x] Phase 3 — AI job-description analysis (Groq integration)
- [x] Phase 4 — React frontend (Tailwind v4, Kanban board, AI cards)
- [x] Phase 5 — Docker + deployment (Multi-stage Dockerfiles, Compose, Render Blueprint)
