from logging.config import fileConfig
from alembic import context
import os
from sqlalchemy import engine_from_config, pool

config = context.config

if config.config_file_name is not None:
    try:
        fileConfig(config.config_file_name, disable_existing_loggers=False)
    except KeyError:
        pass

db_url = os.getenv("DATABASE_URL", "sqlite:///./users.db")
if not db_url:
    raise RuntimeError("DATABASE_URL not set")
config.set_main_option("sqlalchemy.url", db_url)
