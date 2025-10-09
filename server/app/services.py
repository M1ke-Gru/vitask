from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.security import get_password_hash
from app.schemas import UserCreate, UserRead

from .models import UserDB


def get_user(db, user_id: int) -> UserRead:
    userdb = db.get(UserDB, user_id)
    if not userdb:
        raise HTTPException(401, f"User with the user_id {user_id} was not found")
    return UserRead.model_validate(userdb)


def get_user_by_username(db, username: str) -> UserRead:
    stmt = select(UserDB).where(UserDB.username == username)
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(401, f"User with the username {username} was not found")
    return UserRead.model_validate(user)


def get_user_by_email(db, email: str) -> UserRead | None:
    stmt = select(UserDB).where(UserDB.email == email)
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        return None
    return UserRead.model_validate(user)


def create_user(db: Session, user: UserCreate) -> UserRead:
    try:
        db.add(
            UserDB(
                username=user.username,
                email=user.email,
                password=get_password_hash(user.password),
            )
        )
        db.commit()
    except Exception:
        raise HTTPException(400, "The user could not be added to the db")
    try:
        return get_user_by_username(db, user.username)
    except Exception:
        raise HTTPException(401, "User not created or not found")


def delete_user(db: Session, userid: int):
    stmt = select(UserDB).where(UserDB.id == userid)
    user = db.execute(stmt).one_or_none()
    db.delete(user)
    return user


def patch_user(db: Session, user: UserRead):
    userdb = db.get(UserDB, user.id)
    if not userdb:
        return None
    for fields, attributes in dict(user):
        setattr(userdb, fields, attributes)
    return userdb
