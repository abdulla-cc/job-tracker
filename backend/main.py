from contextlib import asynccontextmanager
from datetime import date

from fastapi import Depends, FastAPI, status
from sqlmodel import Session, select

import models  # noqa: F401 - registers tables on SQLModel.metadata
from database import create_db_and_tables, get_session
from models import Application
from schemas import ApplicationCreate, ApplicationRead


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
    session: Session = Depends(get_session),
):
    data = payload.model_dump()
    if data["date_applied"] is None:
        data["date_applied"] = date.today()

    application = Application(**data)
    session.add(application)
    session.commit()
    session.refresh(application)
    return application


@app.get("/applications", response_model=list[ApplicationRead])
def list_applications(session: Session = Depends(get_session)):
    return session.exec(select(Application)).all()
