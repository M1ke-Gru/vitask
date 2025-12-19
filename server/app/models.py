from datetime import datetime, timezone
from sqlalchemy.orm import Mapped, foreign, mapped_column, relationship
from .database import Base
from sqlalchemy import DateTime, ForeignKey, String, null


class UserDB(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(
        String(100), index=True, unique=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(100), index=True, unique=True, nullable=False
    )
    password: Mapped[str] = mapped_column(String(255), nullable=False)

    tasks: Mapped[list["TaskDB"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    tags: Mapped[list["TagDB"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class TaskDB(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30))
    is_done: Mapped[bool] = mapped_column()
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    user: Mapped["UserDB"] = relationship(back_populates="tasks")


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(index=True, nullable=False)
    jti: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    revoked: Mapped[bool] = mapped_column(default=False, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    @staticmethod
    def now() -> datetime:
        return datetime.now(timezone.utc)


class TagDB(Base):
    __tablename__ = "tags"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(30), unique=True)

    user: Mapped["UserDB"] = relationship(back_populates="tags")
