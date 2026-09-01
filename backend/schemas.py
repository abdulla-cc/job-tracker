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
