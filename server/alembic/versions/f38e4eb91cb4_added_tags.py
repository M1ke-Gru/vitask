"""added tags

Revision ID: f38e4eb91cb4
Revises: bdd1ef0cf5dc
Create Date: 2025-12-13 23:32:19.160587

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f38e4eb91cb4'
down_revision: Union[str, Sequence[str], None] = 'bdd1ef0cf5dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
