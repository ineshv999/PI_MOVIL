"""permite usar correo completo como username

Revision ID: a63f7d19c204
Revises: 9b52a1d8e331
"""
from alembic import op
import sqlalchemy as sa

revision = "a63f7d19c204"
down_revision = "9b52a1d8e331"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("usuarios", "username", type_=sa.String(120), existing_type=sa.String(50))


def downgrade():
    op.alter_column("usuarios", "username", type_=sa.String(50), existing_type=sa.String(120))
