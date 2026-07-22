from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///job_tracker.db"

# check_same_thread=False: required for SQLite + FastAPI (see note below)
engine = create_engine(
    DATABASE_URL,
    echo=True,                                    # prints every SQL statement
    connect_args={"check_same_thread": False},
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
