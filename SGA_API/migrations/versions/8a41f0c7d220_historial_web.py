"""historial web separado de auditorias

Revision ID: 8a41f0c7d220
Revises: 7d51c0b2a936
"""
from alembic import op
import sqlalchemy as sa

revision = "8a41f0c7d220"
down_revision = "7d51c0b2a936"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("historial_movimientos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("activo_id", sa.Integer(), sa.ForeignKey("activos.id", ondelete="SET NULL"), nullable=True),
        sa.Column("activo_nombre", sa.String(120), nullable=False),
        sa.Column("ubicacion", sa.String(180), nullable=True),
        sa.Column("accion", sa.String(30), nullable=False),
        sa.Column("resumen", sa.String(500), nullable=False),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index("ix_historial_movimientos_usuario_id", "historial_movimientos", ["usuario_id"])
    op.create_index("ix_historial_movimientos_activo_id", "historial_movimientos", ["activo_id"])
    op.create_index("ix_historial_movimientos_accion", "historial_movimientos", ["accion"])
    op.create_index("ix_historial_movimientos_creado_en", "historial_movimientos", ["creado_en"])
    op.create_table("detalle_historial",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("historial_id", sa.Integer(), sa.ForeignKey("historial_movimientos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("campo", sa.String(80), nullable=False),
        sa.Column("valor_anterior", sa.Text(), nullable=True),
        sa.Column("valor_actual", sa.Text(), nullable=True))
    op.create_index("ix_detalle_historial_historial_id", "detalle_historial", ["historial_id"])
    # La base compartida puede contener activos creados antes de habilitar este historial.
    # Se incorporan como movimientos iniciales sin inventar editores ni cambios pasados.
    op.execute("""
        INSERT INTO historial_movimientos
            (usuario_id, activo_id, activo_nombre, ubicacion, accion, resumen, creado_en)
        SELECT NULL, id, nombre, ubicacion, 'alta', 'Activo existente incorporado al historial web', creado_en
        FROM activos
    """)


def downgrade():
    op.drop_table("detalle_historial")
    op.drop_table("historial_movimientos")
