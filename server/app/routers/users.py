from fastapi import APIRouter, Depends, HTTPException

from ..auth import get_current_active_user
from ..schemas import UserBase

user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.get("", response_model=UserBase)
def read_me(user=Depends(get_current_active_user)):
    if not user:
        raise HTTPException(400, "User is not logged in.")
    return UserBase.model_validate(user)


@user_router.get("/username")
def get_username(user=Depends(get_current_active_user)):
    if not user:
        raise HTTPException(400, "User is not logged in.")
    return user.username
