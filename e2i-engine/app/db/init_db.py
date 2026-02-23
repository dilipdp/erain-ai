from pathlib import Path

from alembic import command
from alembic.config import Config

from app.core.config import settings


def init_db() -> None:
    project_root = Path(__file__).resolve().parents[2]
    alembic_ini = project_root / "alembic.ini"
    alembic_dir = project_root / "alembic"

    cfg = Config(str(alembic_ini))
    cfg.set_main_option("script_location", str(alembic_dir))
    cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(cfg, "head")
