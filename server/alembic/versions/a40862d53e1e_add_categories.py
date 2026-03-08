"""Add categories

Revision ID: a40862d53e1e
Revises: 83c185a55d72
Create Date: 2026-03-08 19:30:02.124348

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a40862d53e1e'
down_revision: Union[str, Sequence[str], None] = '83c185a55d72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    tasks_columns = {c["name"] for c in inspector.get_columns("tasks")}

    # 1. Create categories table if it doesn't already exist
    if "categories" not in existing_tables:
        op.create_table(
            "categories",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=60), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "name", name="uq_category_user_name"),
        )
        op.create_index("ix_categories_user_id", "categories", ["user_id"])

    # 2. Ensure every user has an "Unsorted" category.
    #    Use tasks.user_id if it exists to find all users who have tasks.
    if "user_id" in tasks_columns:
        user_rows = conn.execute(
            sa.text("SELECT DISTINCT user_id FROM tasks")
        ).fetchall()
    else:
        user_rows = conn.execute(sa.text("SELECT id FROM users")).fetchall()

    for (user_id,) in user_rows:
        existing = conn.execute(
            sa.text(
                "SELECT id FROM categories WHERE user_id = :uid AND name = 'Unsorted'"
            ),
            {"uid": user_id},
        ).fetchone()
        if not existing:
            conn.execute(
                sa.text(
                    "INSERT INTO categories (name, user_id) VALUES ('Unsorted', :uid)"
                ),
                {"uid": user_id},
            )

    # 3. Add category_id to tasks (nullable first, populate, then constrain)
    if "category_id" not in tasks_columns:
        op.add_column("tasks", sa.Column("category_id", sa.Integer(), nullable=True))

        if "user_id" in tasks_columns:
            # Populate category_id from the user's Unsorted category
            conn.execute(
                sa.text(
                    """
                    UPDATE tasks t
                    SET category_id = c.id
                    FROM categories c
                    WHERE c.user_id = t.user_id
                      AND c.name = 'Unsorted'
                    """
                )
            )

        op.alter_column("tasks", "category_id", nullable=False)
        op.create_index("ix_tasks_category_id", "tasks", ["category_id"])
        op.create_foreign_key(
            "fk_tasks_category_id",
            "tasks",
            "categories",
            ["category_id"],
            ["id"],
            ondelete="CASCADE",
        )

    # 4. Add new optional columns if missing
    if "due_at" not in tasks_columns:
        op.add_column(
            "tasks",
            sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        )
    if "estimated_duration_s" not in tasks_columns:
        op.add_column(
            "tasks",
            sa.Column("estimated_duration_s", sa.Integer(), nullable=True),
        )

    # 5. Widen name column from String(60) to String(255) if needed
    op.alter_column(
        "tasks",
        "name",
        existing_type=sa.String(60),
        type_=sa.String(255),
        existing_nullable=False,
    )

    # 6. Drop old user_id column from tasks (ownership now via category)
    if "user_id" in tasks_columns:
        # Drop FK constraint first (PostgreSQL requires this)
        fks = inspector.get_foreign_keys("tasks")
        for fk in fks:
            if fk.get("constrained_columns") == ["user_id"]:
                op.drop_constraint(fk["name"], "tasks", type_="foreignkey")
                break
        op.drop_index("ix_tasks_user_id", table_name="tasks", if_exists=True)
        op.drop_column("tasks", "user_id")

    # 7. Drop legacy tags tables if present
    for table in ("task_tag", "tags"):
        if table in existing_tables:
            op.drop_table(table)


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tasks_columns = {c["name"] for c in inspector.get_columns("tasks")}

    # Restore user_id on tasks
    if "user_id" not in tasks_columns:
        op.add_column("tasks", sa.Column("user_id", sa.Integer(), nullable=True))
        conn.execute(
            sa.text(
                """
                UPDATE tasks t
                SET user_id = c.user_id
                FROM categories c
                WHERE c.id = t.category_id
                """
            )
        )
        op.alter_column("tasks", "user_id", nullable=False)
        op.create_index("ix_tasks_user_id", "tasks", ["user_id"])
        op.create_foreign_key(
            "fk_tasks_user_id", "tasks", "users", ["user_id"], ["id"],
            ondelete="CASCADE",
        )

    # Remove category_id
    if "category_id" in tasks_columns:
        op.drop_constraint("fk_tasks_category_id", "tasks", type_="foreignkey")
        op.drop_index("ix_tasks_category_id", table_name="tasks")
        op.drop_column("tasks", "category_id")

    # Remove new columns
    for col in ("due_at", "estimated_duration_s"):
        if col in tasks_columns:
            op.drop_column("tasks", col)

    # Shrink name back (best-effort)
    op.alter_column("tasks", "name", type_=sa.String(60), existing_nullable=False)

    # Drop categories
    op.drop_index("ix_categories_user_id", table_name="categories")
    op.drop_table("categories")
