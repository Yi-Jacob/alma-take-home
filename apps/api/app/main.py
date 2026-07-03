import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, health, leads
from app.core.config import get_settings
from app.db.session import Base, SessionLocal, engine
from app.seed import seed_attorney

logging.basicConfig(level=logging.INFO)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Lead Management API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.web_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(leads.router)

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(engine)
        db = SessionLocal()
        try:
            seed_attorney(db)
        finally:
            db.close()

    @app.get("/")
    def root() -> dict[str, str]:
        return {"service": "lead-management-api", "status": "ok"}

    return app


app = create_app()
