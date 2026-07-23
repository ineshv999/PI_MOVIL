from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import current_user
from app.models import DetalleHistorial, HistorialMovimiento, Usuario

router = APIRouter(prefix="/movimientos", tags=["Movimientos web"])
DbSession = Annotated[Session, Depends(get_db)]


def serialize(row: HistorialMovimiento, db: Session) -> dict:
    user = db.get(Usuario, row.usuario_id) if row.usuario_id else None
    return {"id": row.id, "activo_id": row.activo_id, "activo": row.activo_nombre,
            "folio": f"ACT-{row.activo_id:06d}" if row.activo_id else "Activo eliminado",
            "ubicacion": row.ubicacion, "accion": row.accion, "resumen": row.resumen,
            "creado_en": row.creado_en,
            "usuario_id": row.usuario_id,
            "editor": f"{user.persona.nombres} {user.persona.apellidos}".strip() if user else "Sistema (registro previo)",
            "username": user.username if user else None}


@router.get("")
def list_movements(db: DbSession, _: Annotated[Usuario, Depends(current_user)],
                   limit: int = Query(200, ge=1, le=1000)) -> list[dict]:
    rows = db.scalars(select(HistorialMovimiento).order_by(HistorialMovimiento.creado_en.desc()).limit(limit)).all()
    return [serialize(row, db) for row in rows]


@router.get("/{movement_id}")
def movement_detail(movement_id: int, db: DbSession,
                    _: Annotated[Usuario, Depends(current_user)]) -> dict:
    row = db.get(HistorialMovimiento, movement_id)
    if not row: raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    result = serialize(row, db)
    result["detalles"] = [{"campo": item.campo, "anterior": item.valor_anterior, "actual": item.valor_actual}
                           for item in db.scalars(select(DetalleHistorial).where(DetalleHistorial.historial_id == movement_id).order_by(DetalleHistorial.id)).all()]
    return result
