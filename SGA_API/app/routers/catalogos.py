from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import current_user, require_admin
from app.models import Edificio, Estatus, Usuario
from app.schemas.catalogos import CatalogoCrear, CatalogoRespuesta, EstatusCrear, EstatusRespuesta

router = APIRouter(prefix="/catalogos", tags=["Catalogos"])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("/edificios", response_model=list[CatalogoRespuesta])
def buildings(db: DbSession, _: Annotated[Usuario, Depends(current_user)]) -> list[Edificio]:
    return list(db.scalars(select(Edificio).order_by(Edificio.nombre)).all())


@router.post("/edificios", response_model=CatalogoRespuesta, status_code=status.HTTP_201_CREATED)
def create_building(data: CatalogoCrear, db: DbSession, _: Annotated[Usuario, Depends(require_admin)]) -> Edificio:
    item = Edificio(nombre=data.nombre.strip(), ubicacion=data.ubicacion); db.add(item)
    try: db.commit()
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="El edificio ya existe") from exc
    db.refresh(item); return item


@router.get("/estatus", response_model=list[EstatusRespuesta])
def statuses(db: DbSession, _: Annotated[Usuario, Depends(current_user)]) -> list[Estatus]:
    return list(db.scalars(select(Estatus).order_by(Estatus.nombre)).all())


@router.post("/estatus", response_model=EstatusRespuesta, status_code=status.HTTP_201_CREATED)
def create_status(data: EstatusCrear, db: DbSession, _: Annotated[Usuario, Depends(require_admin)]) -> Estatus:
    item = Estatus(nombre=data.nombre.strip()); db.add(item)
    try: db.commit()
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="El estatus ya existe") from exc
    db.refresh(item); return item
