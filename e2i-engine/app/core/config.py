import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # Default: local postgres; adjust via env var DATABASE_URL
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/e2i",
    )

    # Helpful default toggles
    sql_echo: bool = os.getenv("SQL_ECHO", "0") == "1"


settings = Settings()