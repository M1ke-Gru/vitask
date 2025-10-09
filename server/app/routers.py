# routes_example.py
from fastapi import APIRouter, Depends
from .auth import get_current_active_user
from .schemas import UserBase

user_router = APIRouter(prefix="/user")


@user_router.get("/", response_model=UserBase)
def read_me(user=Depends(get_current_active_user)):
    return user


@user_router.get("/username")
def get_username(user=Depends(get_current_active_user)):
    return user.username
