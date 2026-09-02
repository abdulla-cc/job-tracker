from datetime import date, datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    applications: list["Application"] = Relationship(back_populates="user")
    base_cv: Optional["BaseCV"] = Relationship(back_populates="user")


class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company: str
    role: str
    status: str = Field(default="applied")   # applied / interviewing / offer / rejected
    job_link: Optional[str] = None
    notes: Optional[str] = None
    job_description: Optional[str] = None    # the JD text, stored for tailoring
    date_applied: date = Field(default_factory=date.today)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="applications")


class BaseCV(SQLModel, table=True):
    """The user's master CV, stored as structured JSON fields.

    One per user. The tailor endpoint reads this + a job description
    and uses the LLM to produce a tailored version.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(unique=True, foreign_key="user.id")

    full_name: str
    email: str
    phone: Optional[str] = None
    education: str     # JSON string: [{school, degree, dates}]
    skills: str        # JSON string: ["Python", "FastAPI", ...]
    experience: str    # JSON string: [{title, company, bullets: [...]}]
    projects: str      # JSON string: [{name, description, bullets: [...]}]

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional[User] = Relationship(back_populates="base_cv")
