"""add refresh_sessions table

Revision ID: d96d75efa3b9
Revises: 8ff172448bf4
Create Date: 2025-10-31 00:41:05.870357

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd96d75efa3b9'
down_revision: Union[str, Sequence[str], None] = '8ff172448bf4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
