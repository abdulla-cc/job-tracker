from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ApplicationCreate(BaseModel):
    company: str
    role: str
    status: str = "applied"
    job_link: Optional[str] = None
    notes: Optional[str] = None
    date_applied: Optional[date] = None   # None -> server fills today


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    job_link: Optional[str] = None
    notes: Optional[str] = None
    date_applied: Optional[date] = None


class ApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    role: str
    status: str
    job_link: Optional[str]
    notes: Optional[str]
    job_description: Optional[str]
    date_applied: date
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- AI analysis ----

class AnalyzeRequest(BaseModel):
    """What the frontend sends: just the raw job-description text."""
    job_description: str = Field(min_length=20, max_length=50000)


class AnalyzeResponse(BaseModel):
    """Successful analysis result."""
    requirements: list[str]
    nice_to_haves: list[str]
    fit_score: int
    fit_reasoning: str
    emphasize: list[str]


class AnalyzeError(BaseModel):
    """Structured error when analysis fails."""
    error: str
    detail: Optional[str] = None
    raw_response: Optional[str] = None


# ---- Base CV ----

class BaseCVCreate(BaseModel):
    """What the client sends to save their base CV."""
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: Optional[str] = None
    education: str = Field(min_length=10)     # JSON string
    skills: str = Field(min_length=2)         # JSON string
    experience: str = Field(min_length=10)    # JSON string
    projects: str = Field(min_length=10)      # JSON string


class BaseCVRead(BaseModel):
    """What the client gets back — never exposes internal fields."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str]
    education: str
    skills: str
    experience: str
    projects: str
    created_at: datetime
    updated_at: datetime


# ---- CV Tailoring ----

class TailorRequest(BaseModel):
    """What the frontend sends: the job description to tailor for."""
    job_description: str = Field(min_length=20, max_length=50000)


class TailorResponse(BaseModel):
    """The tailored CV result from the AI."""
    summary: str                          # 1-paragraph custom intro
    skills: list[str]                     # reordered: matching skills first
    experience: list[dict]                # rewritten bullets
    projects: list[dict]                  # rewritten bullets
