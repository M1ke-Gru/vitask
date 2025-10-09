from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base
from sqlalchemy import ForeignKey, String


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


class TaskDB(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30))
    is_done: Mapped[bool] = mapped_column()
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    user: Mapped["UserDB"] = relationship(back_populates="tasks")
