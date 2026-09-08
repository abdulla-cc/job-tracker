import os
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///job_tracker.db")

# Render/Heroku compatibility: SQLAlchemy requires postgresql:// instead of postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite-specific configuration
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    
    # Ensure directory exists if storing in a subfolder (e.g. /app/data/job_tracker.db)
    db_path = DATABASE_URL.replace("sqlite:///", "")
    if "/" in db_path or "\\" in db_path:
        parent_dir = Path(db_path).parent
        parent_dir.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
