from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class UserDB(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    password: Mapped[str] = mapped_column(String(255), nullable=False)

    tasks: Mapped[list[TaskDB]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    tags: Mapped[list[TagDB]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    refresh_sessions: Mapped[list[RefreshSession]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class TaskDB(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    is_done: Mapped[bool] = mapped_column(nullable=False, default=False)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    user: Mapped[UserDB] = relationship(back_populates="tasks")

    task_tags: Mapped[list[TaskTagDB]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
    )


class TagDB(Base):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_tags_user_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(30), nullable=False)

    user: Mapped[UserDB] = relationship(back_populates="tags")

    task_tags: Mapped[list[TaskTagDB]] = relationship(
        back_populates="tag",
        cascade="all, delete-orphan",
    )


class TaskTagDB(Base):
    """
    Association object mapping for tasks <-> tags.
    This is the recommended approach when you might later add metadata on the link
    (e.g. created_at, added_by, ordering, etc.). :contentReference[oaicite:1]{index=1}
    """

    __tablename__ = "task_tag"

    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id"), primary_key=True)

    task: Mapped[TaskDB] = relationship(back_populates="task_tags")
    tag: Mapped[TagDB] = relationship(back_populates="task_tags")


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    user: Mapped[UserDB] = relationship(back_populates="refresh_sessions")

    jti: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)

    revoked: Mapped[bool] = mapped_column(nullable=False, default=False, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    @staticmethod
    def now() -> datetime:
        return datetime.now(timezone.utc)
