from fastapi import FastAPI
import os

app = FastAPI()


@app.get("/api/health")
def health():
    return {"status": "ok"}
