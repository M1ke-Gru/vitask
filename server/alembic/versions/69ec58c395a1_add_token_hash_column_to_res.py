"""Add token_hash column to res

Revision ID: 69ec58c395a1
Revises: 2bac02403609
Create Date: 2025-11-08 23:23:19.944237

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69ec58c395a1'
down_revision: Union[str, Sequence[str], None] = '2bac02403609'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
