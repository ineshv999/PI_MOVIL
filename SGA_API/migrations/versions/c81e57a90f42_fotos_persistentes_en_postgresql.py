"""guarda fotos de perfiles y activos en PostgreSQL

Revision ID: c81e57a90f42
Revises: a63f7d19c204
"""
from alembic import op
import sqlalchemy as sa

revision = "c81e57a90f42"
down_revision = "a63f7d19c204"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("personas", sa.Column("foto_contenido", sa.LargeBinary(), nullable=True))
    op.add_column("personas", sa.Column("foto_mime", sa.String(length=50), nullable=True))
    op.add_column("activos", sa.Column("foto_contenido", sa.LargeBinary(), nullable=True))
    op.add_column("activos", sa.Column("foto_mime", sa.String(length=50), nullable=True))


def downgrade():
    op.drop_column("activos", "foto_mime")
    op.drop_column("activos", "foto_contenido")
    op.drop_column("personas", "foto_mime")
    op.drop_column("personas", "foto_contenido")
