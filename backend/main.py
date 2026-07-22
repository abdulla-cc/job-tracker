from contextlib import asynccontextmanager

from fastapi import FastAPI

import models  # noqa: F401 - registers tables on SQLModel.metadata
from database import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    create_db_and_tables()
    yield
    # shutdown (nothing to clean up yet)


app = FastAPI(
    title="Job Tracker API",
    description="Track job applications, with AI-assisted job-description analysis.",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
def health():
    return {"status": "ok"}
