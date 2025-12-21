import logging

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.security import get_password_hash
from app.schemas import UserRead

from app.models import UserDB

logger = logging.getLogger(__name__)


def get_user(db, user_id: int) -> UserDB:
    userdb = db.get(UserDB, user_id)
    if not userdb:
        raise HTTPException(401, f"User with the user_id {user_id} was not found")
    return userdb


def get_user_by_username(db, username: str) -> UserDB:
    stmt = select(UserDB).where(UserDB.username == username)
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(401, "The username or password is incorrect.")
    return user


def get_user_by_email(db, email: str) -> UserDB | None:
    stmt = select(UserDB).where(UserDB.email == email)
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        return None
    return user


def create_user(db: Session, username: str, email: str, password: str) -> UserDB:
    user = UserDB(
        username=username,
        email=email,
        password=get_password_hash(password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        orig = getattr(exc, "orig", None)
        message = str(orig or exc)
        message_lc = message.lower()

        constraint_name = None
        diag = getattr(orig, "diag", None)
        if diag is not None:
            constraint_name = getattr(diag, "constraint_name", None)
        constraint_name = constraint_name or getattr(orig, "constraint_name", None)
        constraint_lc = (constraint_name or "").lower()

        is_username_conflict = (
            "users_username_key" in constraint_lc
            or "username" in constraint_lc
            or "users.username" in message_lc
            or "key (username)" in message_lc
        )
        is_email_conflict = (
            "users_email_key" in constraint_lc
            or "email" in constraint_lc
            or "users.email" in message_lc
            or "key (email)" in message_lc
        )

        if is_username_conflict:
            raise HTTPException(400, "A user with the same username exists already.")
        if is_email_conflict:
            raise HTTPException(400, "A user with the same email exists already.")

        logger.exception(
            "Database integrity error while creating user (username=%s, email=%s): %s",
            username,
            email,
            message,
        )
        raise HTTPException(500, "Database constraint error while creating user")
    except SQLAlchemyError:
        db.rollback()
        logger.exception(
            "Database error while creating user (username=%s, email=%s)",
            username,
            email,
        )
        raise HTTPException(500, "Database error while creating user")

    db.refresh(user)
    return user


def delete_user(db: Session, userid: int):
    stmt = select(UserDB).where(UserDB.id == userid)
    user = db.execute(stmt).one_or_none()
    db.delete(user)
    return user


def patch_user(db: Session, user: UserRead):
    userdb = db.get(UserDB, user.id)
    if not userdb:
        return None
    for fields, attributes in user.model_dump().items():
        setattr(userdb, fields, attributes)
    db.commit()
    return userdb
