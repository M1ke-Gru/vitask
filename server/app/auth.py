from datetime import datetime, timedelta, timezone
from typing import Annotated

import secrets
import hashlib
import uuid
import jwt
from jwt import InvalidTokenError
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os

from app.models import UserDB

from .database import get_db
from .services.users import get_user_by_username, create_user, get_user
from .schemas import UserCreate, UserRead
from .security import verify_password
from .models import RefreshSession

ALGORITHM = "HS256"
# TODO: SECRET_KEY in env
SECRET_KEY = "9746bd6511e406f722f188391bda26cf7e8119695f972b75ca23e2912f92f32d"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

AUTH_TOKEN_ENDPOINT = "/auth/token"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=AUTH_TOKEN_ENDPOINT)
router_name: str = "auth"
domain = os.getenv("COOKIE_DOMAIN", "vitask.app")
auth_router = APIRouter(prefix="/" + router_name, tags=[router_name])
is_local = domain in ("localhost", "127.0.0.1")


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    revoked: bool = False
    revoked_at: datetime | None = None


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


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def issue_refresh_token(db: Session, user_id: int) -> str:
    """Create and store a new refresh token, return raw value."""
    raw = secrets.token_urlsafe(64)
    row = RefreshSession(
        user_id=user_id,
        jti=str(uuid.uuid4()),
        token_hash=_hash_token(raw),
        expires_at=_now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(row)
    db.commit()
    return raw


def rotate_refresh_token(db: Session, old_raw: str, user_id: int) -> str | None:
    """Revoke old and issue new one if valid."""
    row = db.scalar(
        select(RefreshSession).where(
            RefreshSession.token_hash == _hash_token(old_raw),
            RefreshSession.revoked.is_(False),
            RefreshSession.user_id == user_id,
        )
    )
    if not row or row.expires_at <= _now():
        return None
    row.revoked = True
    row.revoked_at = _now()
    db.commit()
    return issue_refresh_token(db, user_id)


def revoke_all_refresh_tokens(db: Session, user_id: int):
    db.execute(
        update(RefreshSession)
        .where(RefreshSession.user_id == user_id, RefreshSession.revoked.is_(False))
        .values(revoked=True, revoked_at=_now())
    )
    db.commit()


@auth_router.post("/signup", status_code=201, response_model=UserRead)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    try:
        get_user_by_username(db, user_in.username)
    except Exception:
        return UserRead.model_validate(
            create_user(db, user_in.username, user_in.email, user_in.password)
        )
    else:
        raise HTTPException(400, "A user with the same username exists already.")


@auth_router.post("/token", response_model=Token)
def login_for_tokens(
    response: Response,
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

    raw_refresh = issue_refresh_token(db, user.id)

    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=not is_local,
        samesite="lax" if is_local else "none",
        domain=None if is_local else domain,
        path="/auth",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )

    return Token(
        user_id=user.id,
        access_token=create_access_token(sub),
        refresh_token="set-in-cookie",
    )


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
) -> UserDB:
    payload = decode_token(token)
    if payload.typ != "access":
        raise HTTPException(401, "Use an access token.")
    user = get_user(db, int(payload.sub))
    if not user:
        raise HTTPException(401, "User not found.")
    return user


def get_current_active_user(current_user: UserDB = Depends(get_current_user)) -> UserDB:
    if getattr(current_user, "is_active", True) is False:
        raise HTTPException(400, "Inactive user.")
    return current_user


@auth_router.post("/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    user: UserRead = Depends(get_current_active_user),
):
    response.delete_cookie(
        key="refresh_token",
        domain=domain,
        path="/auth",
    )

    db.execute(
        update(RefreshSession)
        .where(RefreshSession.user_id == user.id, RefreshSession.revoked.is_(False))
        .values(revoked=True, revoked_at=datetime.now(timezone.utc))
    )
    db.commit()

    return {"detail": "Logged out"}


@auth_router.post("/refresh", response_model=Token)
def refresh_access_token(
    response: Response,
    db: Session = Depends(get_db),
    rtoken: str | None = Cookie(default=None, alias="refresh_token"),
):
    if not rtoken:
        raise HTTPException(401, "No refresh token")

    # Look up session
    row = db.scalar(
        select(RefreshSession).where(
            RefreshSession.token_hash == _hash_token(rtoken),
            RefreshSession.revoked.is_(False),
        )
    )
    if not row or row.expires_at <= _now():
        raise HTTPException(401, "Invalid or expired refresh token")

    new_raw = rotate_refresh_token(db, rtoken, row.user_id)
    if not new_raw:
        raise HTTPException(401, "Rotation failed")

    # Issue new access token
    access = create_access_token(str(row.user_id))

    # Set new cookie
    response.set_cookie(
        key="refresh_token",
        value=new_raw,
        httponly=True,
        secure=True,
        samesite="none",
        domain="vitask.app",
        path="/" + router_name,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )

    return Token(
        user_id=row.user_id,
        access_token=access,
        refresh_token="rotated-in-cookie",
    )
