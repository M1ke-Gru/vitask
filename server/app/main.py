from fastapi import FastAPI

from .routers import user_router
from app.database import Base, engine
from app.auth import auth_router

app = FastAPI()

app.include_router(user_router)
app.include_router(auth_router)


@app.get("/")
async def hi():
    return {"message": "hi"}


Base.metadata.create_all(engine)
