"""linked tags to tasks

Revision ID: 02aa36e697f3
Revises: f38e4eb91cb4
Create Date: 2025-12-19 03:05:06.651165

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '02aa36e697f3'
down_revision: Union[str, Sequence[str], None] = 'f38e4eb91cb4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
