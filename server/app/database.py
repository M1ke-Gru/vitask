from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = "sqlite:///./users.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # OK for SQLite in web apps
)


# 2.x: subclass DeclarativeBase instead of declarative_base()
class Base(DeclarativeBase):
    pass


# 2.x: autocommit is gone; configure what you need explicitly
SessionLocal = sessionmaker(
    bind=engine, autoflush=False
)  # add expire_on_commit=False if you want

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
