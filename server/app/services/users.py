from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.security import get_password_hash
from app.schemas import UserRead

from app.models import UserDB


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
        message = str(getattr(exc, "orig", exc))
        if "users_username_key" in message or "UNIQUE constraint failed: users.username" in message:
            raise HTTPException(400, "A user with the same username exists already.")
        if "users_email_key" in message or "UNIQUE constraint failed: users.email" in message:
            raise HTTPException(400, "A user with the same email exists already.")
        raise HTTPException(400, "The user could not be added to the db")
    except SQLAlchemyError:
        db.rollback()
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
