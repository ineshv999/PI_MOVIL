"""Perfil completo de colaborador.

Revision ID: 4c2b8e79a101
Revises: 095c30d34b56
"""
from alembic import op
import sqlalchemy as sa

revision = "4c2b8e79a101"
down_revision = "095c30d34b56"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("personas", sa.Column("puesto", sa.String(length=100), nullable=True))
    op.add_column("personas", sa.Column("edad", sa.Integer(), nullable=True))
    op.add_column("personas", sa.Column("domicilio", sa.String(length=250), nullable=True))
    op.add_column("personas", sa.Column("foto_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("personas", "foto_url")
    op.drop_column("personas", "domicilio")
    op.drop_column("personas", "edad")
    op.drop_column("personas", "puesto")
