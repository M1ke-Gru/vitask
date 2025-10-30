"""add token_hash column

Revision ID: 2bac02403609
Revises: d96d75efa3b9
Create Date: 2025-10-31 00:43:22.388869

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2bac02403609"
down_revision: Union[str, Sequence[str], None] = "d96d75efa3b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from alembic import op

    op.add_column(
        "refresh_sessions",
        sa.Column("token_hash", sa.String(length=64), nullable=True),
    )
    op.create_unique_constraint(
        "uq_refresh_sessions_token_hash", "refresh_sessions", ["token_hash"]
    )


def downgrade() -> None:
    """Downgrade schema."""
    pass
