# server/app/database.py
import os
from typing import Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.engine.url import make_url

# Read from env. In Docker Compose you set DATABASE_URL in the service.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./users.db")

url = make_url(DATABASE_URL)

# Driver-specific options
connect_args: Dict[str, Any] = {}
engine_kwargs: Dict[str, Any] = {"pool_pre_ping": True}

if url.get_backend_name().startswith("sqlite"):
    # sqlite:///relative.db  or sqlite:////absolute.db
    connect_args = {"check_same_thread": False}
    # SQLite doesn’t use real connection pooling
else:
    # Reasonable defaults for Postgres (tune as you like)
    engine_kwargs.update(
        pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
    )

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)


class Base(DeclarativeBase):
    pass


# expire_on_commit=False keeps objects usable after commit (handy for APIs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
