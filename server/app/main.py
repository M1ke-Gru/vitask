from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routers import user_router, task_router
from app.database import Base, engine
from app.auth import auth_router

app = FastAPI()

origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # cannot be "*" if allow_credentials=True
    allow_credentials=True,  # False if you don't use cookies
    allow_methods=["*"],  # includes OPTIONS
    allow_headers=["*"],  # e.g., Authorization, Content-Type
)

app.include_router(user_router)
app.include_router(auth_router)
app.include_router(task_router)


@app.get("/")
async def hi():
    return {"message": "hi"}


@app.get("/health")
async def health():
    return {"message": "Server running"}


Base.metadata.create_all(engine)
