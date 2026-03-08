"""
Migration bootstrap script.

Handles the case where the database was previously managed by SQLAlchemy's
create_all() instead of Alembic. If no alembic_version entry exists, stamps
the DB at the last revision that predates the categories migration (all prior
migrations were either stubs or already applied by create_all), then upgrades
to HEAD so only new migrations actually execute.
"""
import subprocess
import sys
from pathlib import Path

from sqlalchemy import inspect, text

from app.database import Base, engine
from app import models  # noqa: F401 — registers all ORM models

# Revision just before the first "real" migration (add categories)
PRE_CATEGORIES_REVISION = "83c185a55d72"
# Find alembic in the same venv as the running Python interpreter
ALEMBIC = str(Path(sys.executable).parent / "alembic")


def run(*args: str) -> None:
    result = subprocess.run([ALEMBIC, *args])
    if result.returncode != 0:
        sys.exit(result.returncode)


# 1. Ensure all tables exist (idempotent; safe on both fresh and existing DBs)
Base.metadata.create_all(engine)

# 2. If Alembic has never tracked this DB, stamp at the pre-categories revision
#    so upgrade head only runs the categories migration (and any future ones).
with engine.connect() as conn:
    insp = inspect(engine)
    if "alembic_version" not in insp.get_table_names():
        print(f"No alembic_version table found — stamping at {PRE_CATEGORIES_REVISION}")
        run("stamp", PRE_CATEGORIES_REVISION)

# 3. Run any pending migrations
run("upgrade", "head")
