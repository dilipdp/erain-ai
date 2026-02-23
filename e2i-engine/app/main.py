from fastapi import FastAPI

from app.api.v1.router import api_v1_router
from app.db.init_db import init_db


def create_app() -> FastAPI:
    app = FastAPI(title="E2I Engine", version="0.1.0")

    @app.on_event("startup")
    def _startup() -> None:
        init_db()

    app.include_router(api_v1_router, prefix="/api/v1")
    return app


app = create_app()