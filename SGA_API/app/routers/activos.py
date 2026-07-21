from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import current_user, require_admin
from app.models import Activo, Edificio, Estatus, Usuario
from app.schemas.activos import ActivoActualizar, ActivoCrear, ActivoRespuesta

router = APIRouter(prefix="/activos", tags=["Activos"])
DbSession = Annotated[Session, Depends(get_db)]


def validate_catalogs(data: ActivoCrear | ActivoActualizar, db: Session) -> None:
    if data.edificio_id and not db.get(Edificio, data.edificio_id):
        raise HTTPException(status_code=422, detail="El edificio no existe")
    if data.estatus_id and not db.get(Estatus, data.estatus_id):
        raise HTTPException(status_code=422, detail="El estatus no existe")


@router.get("", response_model=list[ActivoRespuesta])
def list_assets(db: DbSession, _: Annotated[Usuario, Depends(current_user)], buscar: str | None = None,
                skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500)) -> list[Activo]:
    query = select(Activo)
    if buscar:
        term = f"%{buscar.strip()}%"
        query = query.where(or_(Activo.nombre.ilike(term), Activo.codigo_qr.ilike(term), Activo.numero_serie.ilike(term)))
    return list(db.scalars(query.order_by(Activo.nombre).offset(skip).limit(limit)).all())


@router.get("/qr/{codigo_qr}", response_model=ActivoRespuesta)
def get_by_qr(codigo_qr: str, db: DbSession, _: Annotated[Usuario, Depends(current_user)]) -> Activo:
    asset = db.scalar(select(Activo).where(Activo.codigo_qr == codigo_qr.strip()))
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return asset


@router.get("/{asset_id}", response_model=ActivoRespuesta)
def get_asset(asset_id: int, db: DbSession, _: Annotated[Usuario, Depends(current_user)]) -> Activo:
    asset = db.get(Activo, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return asset


@router.post("", response_model=ActivoRespuesta, status_code=status.HTTP_201_CREATED)
def create_asset(data: ActivoCrear, db: DbSession, _: Annotated[Usuario, Depends(require_admin)]) -> Activo:
    validate_catalogs(data, db)
    asset = Activo(**data.model_dump())
    db.add(asset)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="El codigo QR o numero de serie ya existe") from exc
    db.refresh(asset)
    return asset


@router.patch("/{asset_id}", response_model=ActivoRespuesta)
def update_asset(asset_id: int, data: ActivoActualizar, db: DbSession,
                 _: Annotated[Usuario, Depends(require_admin)]) -> Activo:
    asset = db.get(Activo, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    validate_catalogs(data, db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(asset, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="Numero de serie duplicado") from exc
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=204)
def deactivate_asset(asset_id: int, db: DbSession, _: Annotated[Usuario, Depends(require_admin)]) -> None:
    asset = db.get(Activo, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    asset.activo = False; db.commit()
