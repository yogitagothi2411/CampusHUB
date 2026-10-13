import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Database URL – can be overridden by env var for testing or deployment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/campus_events.db")

# For SQLite we need to allow the "check_same_thread" flag
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()

# Function to create tables (called on app startup)
def init_db():
    if DATABASE_URL.startswith("sqlite:///"):
        db_path = DATABASE_URL.replace("sqlite:///", "")
        dir_name = os.path.dirname(os.path.abspath(db_path))
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


