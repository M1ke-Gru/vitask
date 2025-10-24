from logging.config import fileConfig
from alembic import context
import os
from sqlalchemy import engine_from_config, pool

config = context.config

# Only configure logging if alembic.ini exists AND has logging sections
if config.config_file_name is not None:
    try:
        fileConfig(config.config_file_name, disable_existing_loggers=False)
    except KeyError:
        # Missing [formatters]/[handlers]/[loggers] — skip logging setup
        pass

# Set DB URL from env so we don’t depend on alembic.ini
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise RuntimeError("DATABASE_URL not set")
config.set_main_option("sqlalchemy.url", db_url)
