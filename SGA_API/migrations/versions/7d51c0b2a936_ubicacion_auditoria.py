"""Ubicacion y edificio de auditoria.

Revision ID: 7d51c0b2a936
Revises: 4c2b8e79a101
"""
from alembic import op
import sqlalchemy as sa

revision = "7d51c0b2a936"
down_revision = "4c2b8e79a101"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("auditorias", sa.Column("edificio_id", sa.Integer(), nullable=True))
    op.add_column("auditorias", sa.Column("ubicacion_detalle", sa.String(length=180), nullable=True))
    op.create_foreign_key("fk_auditorias_edificio", "auditorias", "edificios", ["edificio_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_auditorias_edificio", "auditorias", type_="foreignkey")
    op.drop_column("auditorias", "ubicacion_detalle")
    op.drop_column("auditorias", "edificio_id")
