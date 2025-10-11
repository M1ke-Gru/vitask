from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import user_router
from app.database import Base, engine
from app.auth import auth_router

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # cannot be "*" if allow_credentials=True
    allow_credentials=True,  # False if you don't use cookies
    allow_methods=["*"],  # includes OPTIONS
    allow_headers=["*"],  # e.g., Authorization, Content-Type
)

# Routers
app.include_router(user_router)
app.include_router(auth_router)


@app.get("/")
async def hi():
    return {"message": "hi"}


Base.metadata.create_all(engine)
