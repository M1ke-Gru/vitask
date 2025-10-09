from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from jwt import InvalidTokenError
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select, String, DateTime, update
from sqlalchemy.orm import Session, Mapped, mapped_column
from pydantic import BaseModel

from app.models import UserDB

from .database import get_db, Base
from .services import get_user_by_username, create_user, get_user
from .schemas import UserCreate, UserRead
from .security import verify_password

ALGORITHM = "HS256"
# TODO: SECRET_KEY in env
SECRET_KEY = "9746bd6511e406f722f188391bda26cf7e8119695f972b75ca23e2912f92f32d"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")
auth_router = APIRouter(prefix="/auth", tags=["auth"])


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    revoked: bool = False
    revoked_at: datetime | None = None


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(index=True, nullable=False)
    jti: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    revoked: Mapped[bool] = mapped_column(default=False, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class TokenPayload(BaseModel):
    sub: str
    typ: str
    exp: int


def _now():
    return datetime.now(timezone.utc)


def _create_token(*, subject: str, token_type: str, expires_delta: timedelta) -> str:
    exp = _now() + expires_delta
    payload = {
        "sub": subject,
        "typ": token_type,
        "exp": int(exp.timestamp()),
        "iat": int(_now().timestamp()),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(sub: str) -> str:
    return _create_token(
        subject=sub,
        token_type="access",
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(sub: str) -> str:
    return _create_token(
        subject=sub,
        token_type="refresh",
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> TokenPayload:
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenPayload(**data)
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


def authenticate_user(db: Session, username: str, password: str):
    user = db.execute(
        select(UserDB).where(UserDB.username == username)
    ).scalar_one_or_none()
    if not user or not verify_password(password, user.password):
        return None
    return user


@auth_router.post("/signup", status_code=201, response_model=UserRead)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    try:
        get_user_by_username(db, user_in.username)
    except Exception:
        return create_user(db, user_in)
    else:
        raise HTTPException(400, "A user with the same username exists already.")


@auth_router.post("/token", response_model=Token)
def login_for_tokens(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    candidate = get_user_by_username(db, form.username)
    if not candidate:
        raise HTTPException(401, "The username or password is incorrect.")
    user = authenticate_user(db, candidate.username, form.password)
    if not user:
        raise HTTPException(401, "The username or password is incorrect.")
    sub = str(user.id)
    return Token(
        user_id=user.id,
        access_token=create_access_token(sub),
        refresh_token=create_refresh_token(sub),
    )


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    payload = decode_token(token)
    if payload.typ != "access":
        raise HTTPException(401, "Use an access token.")
    user = get_user(db, int(payload.sub))
    if not user:
        raise HTTPException(401, "User not found.")
    return user


def get_current_active_user(current_user=Depends(get_current_user)):
    if getattr(current_user, "is_active", True) is False:
        raise HTTPException(400, "Inactive user.")
    return current_user


@auth_router.post("/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    user: UserRead = Depends(get_current_active_user),
):
    response.delete_cookie("refresh_token", path="/auth")

    db.execute(
        update(RefreshSession)
        .where(RefreshSession.user_id == user.id, RefreshSession.revoked.is_(False))
        .values(revoked=True, revoked_at=datetime.now(timezone.utc))
    )
    db.commit()

    return {"detail": "Logged out"}
