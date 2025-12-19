import os
from typing import Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.engine.url import make_url

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

url = make_url(DATABASE_URL)

connect_args: Dict[str, Any] = {}
engine_kwargs: Dict[str, Any] = {"pool_pre_ping": True}

if url.get_backend_name().startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Postgres defaults
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


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
