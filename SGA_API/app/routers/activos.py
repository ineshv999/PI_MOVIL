from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import current_user, require_admin
from app.models import Activo, Usuario
from app.schemas.activos import ActivoCrear, ActivoRespuesta

router = APIRouter(prefix="/activos", tags=["Activos"])
DbSession = Annotated[Session, Depends(get_db)]


def serialize(asset: Activo) -> ActivoRespuesta:
    return ActivoRespuesta(id=asset.id, codigo_qr=asset.codigo_qr, nombre=asset.nombre, descripcion=asset.descripcion, numero_serie=asset.numero_serie, edificio_id=asset.edificio_id, estatus_id=asset.estatus_id)


@router.get("", response_model=list[ActivoRespuesta])
def list_assets(db: DbSession, _: Annotated[Usuario, Depends(current_user)]) -> list[ActivoRespuesta]:
    return [serialize(asset) for asset in db.scalars(select(Activo).order_by(Activo.nombre)).all()]


@router.get("/qr/{codigo_qr}", response_model=ActivoRespuesta)
def get_by_qr(codigo_qr: str, db: DbSession, _: Annotated[Usuario, Depends(current_user)]) -> ActivoRespuesta:
    asset = db.scalar(select(Activo).where(Activo.codigo_qr == codigo_qr))
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return serialize(asset)


@router.post("", response_model=ActivoRespuesta, status_code=status.HTTP_201_CREATED)
def create_asset(data: ActivoCrear, db: DbSession, _: Annotated[Usuario, Depends(require_admin)]) -> ActivoRespuesta:
    asset = Activo(**data.model_dump())
    db.add(asset)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="El código QR o número de serie ya existe") from exc
    db.refresh(asset)
    return serialize(asset)
