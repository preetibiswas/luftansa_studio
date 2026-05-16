from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str


app = FastAPI(title="Lufthansa POC Mock Auth")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/auth/login")
def login(payload: LoginRequest) -> dict[str, str]:
    return {
        "token": str(uuid4()),
        "email": payload.email,
    }
