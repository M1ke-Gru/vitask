from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.security import get_password_hash
from app.schemas import UserRead

from app.models import UserDB

# TODO: get pydantic out of the service layer.


def get_user(db, user_id: int) -> UserDB:
    userdb = db.get(UserDB, user_id)
    if not userdb:
        raise HTTPException(401, f"User with the user_id {user_id} was not found")
    return userdb


def get_user_by_username(db, username: str) -> UserDB:
    stmt = select(UserDB).where(UserDB.username == username)
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(401, f"User with the username {username} was not found")
    return user


def get_user_by_email(db, email: str) -> UserDB | None:
    stmt = select(UserDB).where(UserDB.email == email)
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        return None
    return user


def create_user(db: Session, username: str, email: str, password: str) -> UserDB:
    try:
        user = UserDB(
            username=username,
            email=email,
            password=get_password_hash(password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        raise HTTPException(400, "The user could not be added to the db")
    try:
        return get_user_by_username(db, username)
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
    db.commit()
    return userdb
