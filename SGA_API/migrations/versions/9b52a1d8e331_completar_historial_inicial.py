"""completa responsable y detalles del historial inicial

Revision ID: 9b52a1d8e331
Revises: 8a41f0c7d220
"""
from alembic import op

revision = "9b52a1d8e331"
down_revision = "8a41f0c7d220"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        UPDATE historial_movimientos h
        SET usuario_id = (
            SELECT u.id FROM usuarios u
            JOIN roles r ON r.id = u.rol_id
            WHERE r.nombre = 'administrador'
            ORDER BY u.id LIMIT 1
        ), resumen = 'Alta de activo'
        WHERE h.usuario_id IS NULL AND h.resumen = 'Activo existente incorporado al historial web'
    """)
    op.execute("""
        INSERT INTO detalle_historial (historial_id, campo, valor_anterior, valor_actual)
        SELECT h.id, 'Nombre', NULL, a.nombre
        FROM historial_movimientos h JOIN activos a ON a.id = h.activo_id
        WHERE h.accion = 'alta' AND NOT EXISTS
            (SELECT 1 FROM detalle_historial d WHERE d.historial_id = h.id)
    """)
    op.execute("""
        INSERT INTO detalle_historial (historial_id, campo, valor_anterior, valor_actual)
        SELECT h.id, 'Ubicacion', NULL, a.ubicacion
        FROM historial_movimientos h JOIN activos a ON a.id = h.activo_id
        WHERE h.accion = 'alta' AND a.ubicacion IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM detalle_historial d WHERE d.historial_id = h.id AND d.campo = 'Ubicacion')
    """)


def downgrade():
    pass
