"""Add token_hash column to res

Revision ID: 46158b1523cb
Revises: 69ec58c395a1
Create Date: 2025-11-08 23:25:40.775175

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46158b1523cb'
down_revision: Union[str, Sequence[str], None] = '69ec58c395a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
