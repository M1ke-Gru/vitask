"""added tags

Revision ID: bdd1ef0cf5dc
Revises: 46158b1523cb
Create Date: 2025-12-13 23:25:39.121375

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bdd1ef0cf5dc'
down_revision: Union[str, Sequence[str], None] = '46158b1523cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
