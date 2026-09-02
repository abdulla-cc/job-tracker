from contextlib import asynccontextmanager
from datetime import date, datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

import models  # noqa: F401 - registers tables on SQLModel.metadata
from database import create_db_and_tables, get_session
from dependencies import get_current_user
from models import Application, BaseCV, User
from routers import auth
from schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ApplicationCreate,
    ApplicationRead,
    ApplicationUpdate,
    BaseCVCreate,
    BaseCVRead,
    TailorRequest,
    TailorResponse,
)
from ai_service import analyze as analyze_jd, tailor_cv


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Job Tracker API",
    description="Track job applications, with AI-assisted job-description analysis.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)


def get_application_or_404(
    application_id: int, user: User, session: Session
) -> Application:
    """Fetch an application by id that belongs to the user, or raise a 404.

    Returns 404 whether the row doesn't exist *or* belongs to another user,
    so we never confirm a non-owner that the resource exists.
    """
    application = session.get(Application, application_id)
    if application is None or application.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found",
        )
    return application


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post(
    "/applications",
    response_model=ApplicationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    payload: ApplicationCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    data = payload.model_dump()
    if data["date_applied"] is None:
        data["date_applied"] = date.today()

    # user_id comes from the JWT, never from the client
    application = Application(**data, user_id=user.id)
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@app.get("/applications", response_model=list[ApplicationRead])
def list_applications(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return session.exec(
        select(Application).where(Application.user_id == user.id)
    ).all()


@app.get("/applications/{application_id}", response_model=ApplicationRead)
def get_application(
    application_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return get_application_or_404(application_id, user, session)


@app.patch("/applications/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    application = get_application_or_404(application_id, user, session)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(application, field, value)

    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@app.delete(
    "/applications/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_application(
    application_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    application = get_application_or_404(application_id, user, session)
    session.delete(application)
    session.commit()


# ---- AI analysis endpoint ----


@app.post(
    "/analyze",
    response_model=AnalyzeResponse,
)
def analyze_job_description(
    payload: AnalyzeRequest,
    user: User = Depends(get_current_user),
):
    """Analyze a job description against the candidate profile.

    Protected -- only logged-in users can use the AI feature.
    Returns structured JSON: requirements, fit_score, reasoning, and
    suggested bullets to emphasize.
    """
    result = analyze_jd(payload.job_description)

    # If the AI service returned an error, surface it as a 422 or 503
    if "error" in result:
        if result["error"] == "groq_api_error":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI analysis is temporarily unavailable. Please try again.",
            )
        # analysis_unavailable -- malformed response, still return gracefully
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not parse the AI response. Please try again with a different job description.",
        )

    return result



# ---- Base CV endpoints ----


@app.post("/cv", response_model=BaseCVRead, status_code=status.HTTP_201_CREATED)
def save_base_cv(
    payload: BaseCVCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Save or update the user's base CV. One CV per user - upsert logic."""
    existing = session.exec(
        select(BaseCV).where(BaseCV.user_id == user.id)
    ).first()

    if existing:
        # Update existing CV
        for field, value in payload.model_dump().items():
            setattr(existing, field, value)
        existing.updated_at = datetime.now(timezone.utc)
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    else:
        # Create new CV
        cv = BaseCV(**payload.model_dump(), user_id=user.id)
        session.add(cv)
        session.commit()
        session.refresh(cv)
        return cv


@app.get("/cv", response_model=BaseCVRead)
def get_base_cv(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Retrieve the user's base CV. 404 if they haven't created one yet."""
    cv = session.exec(
        select(BaseCV).where(BaseCV.user_id == user.id)
    ).first()
    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No CV found. Create one first with POST /cv.",
        )
    return cv


# ---- CV Tailoring endpoint ----


@app.post("/tailor-cv", response_model=TailorResponse)
def tailor_cv_endpoint(
    payload: TailorRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Tailor the user's base CV to a specific job description.

    Loads the user's stored CV, sends it + the JD to the LLM,
    and returns a rewritten version optimized for that role.
    """
    # Load the user's base CV
    cv = session.exec(
        select(BaseCV).where(BaseCV.user_id == user.id)
    ).first()
    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Save your base CV first with POST /cv before tailoring.",
        )

    # Parse the JSON string fields into Python objects
    import json as _json
    base_cv_dict = {
        "full_name": cv.full_name,
        "email": cv.email,
        "phone": cv.phone,
        "education": _json.loads(cv.education),
        "skills": _json.loads(cv.skills),
        "experience": _json.loads(cv.experience),
        "projects": _json.loads(cv.projects),
    }

    # Call the AI
    result = tailor_cv(base_cv_dict, payload.job_description)

    if "error" in result:
        if result["error"] == "groq_api_error":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI tailoring is temporarily unavailable. Please try again.",
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not parse the AI response. Please try again.",
        )

    return result
