"""linked tags to tasks

Revision ID: 83c185a55d72
Revises: 02aa36e697f3
Create Date: 2025-12-21 04:55:16.893110

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83c185a55d72'
down_revision: Union[str, Sequence[str], None] = '02aa36e697f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
