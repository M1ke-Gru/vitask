from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routers import user_router, task_router
from app.database import Base, engine
from app.auth import auth_router


def parse_origins(raw: str) -> list[str]:
    # Split, strip, and drop empties
    return [o.strip() for o in raw.split(",") if o.strip()]


DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://vitask.app",
]

raw = os.getenv("ALLOWED_ORIGINS", "")
origins = parse_origins(raw) or DEFAULT_ORIGINS

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # must be explicit with credentials
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["*"],
)

print(origins)

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
