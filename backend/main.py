from contextlib import asynccontextmanager
from datetime import date

from fastapi import Depends, FastAPI, HTTPException, status
from sqlmodel import Session, select

import models  # noqa: F401 - registers tables on SQLModel.metadata
from database import create_db_and_tables, get_session
from dependencies import get_current_user
from models import Application, User
from routers import auth
from schemas import ApplicationCreate, ApplicationRead, ApplicationUpdate


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
