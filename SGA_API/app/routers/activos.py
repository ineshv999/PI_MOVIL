from typing import Annotated
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
import qrcode
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import current_user, require_admin
from app.models import Activo, Edificio, Estatus, Usuario
from app.schemas.activos import ActivoActualizar, ActivoCrear, ActivoRespuesta

router = APIRouter(prefix="/activos", tags=["Activos"])
DbSession = Annotated[Session, Depends(get_db)]


def asset_response(asset: Activo) -> dict:
    return {**{c.name: getattr(asset, c.name) for c in asset.__table__.columns}, "folio": f"ACT-{asset.id:06d}"}


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
    return [asset_response(item) for item in db.scalars(query.order_by(Activo.nombre).offset(skip).limit(limit)).all()]


@router.get("/qr/{codigo_qr}", response_model=ActivoRespuesta)
def get_by_qr(codigo_qr: str, db: DbSession, _: Annotated[Usuario, Depends(current_user)]) -> Activo:
    asset = db.scalar(select(Activo).where(Activo.codigo_qr == codigo_qr.strip()))
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return asset_response(asset)


@router.get("/{asset_id}", response_model=ActivoRespuesta)
def get_asset(asset_id: int, db: DbSession, _: Annotated[Usuario, Depends(current_user)]) -> Activo:
    asset = db.get(Activo, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return asset_response(asset)


@router.post("", response_model=ActivoRespuesta, status_code=status.HTTP_201_CREATED)
def create_asset(data: ActivoCrear, db: DbSession, _: Annotated[Usuario, Depends(require_admin)]) -> Activo:
    validate_catalogs(data, db)
    values = data.model_dump()
    values["codigo_qr"] = values["codigo_qr"] or f"SGA-{uuid4().hex.upper()}"
    asset = Activo(**values)
    db.add(asset)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="El codigo QR o numero de serie ya existe") from exc
    db.refresh(asset)
    return asset_response(asset)


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
    return asset_response(asset)


@router.get("/{asset_id}/qr", summary="Descarga el QR unico del activo")
def download_qr(asset_id: int, db: DbSession, _: Annotated[Usuario, Depends(current_user)]) -> Response:
    asset = db.get(Activo, asset_id)
    if not asset: raise HTTPException(status_code=404, detail="Activo no encontrado")
    image = qrcode.make(asset.codigo_qr); output = BytesIO(); image.save(output, format="PNG")
    return Response(output.getvalue(), media_type="image/png", headers={"Content-Disposition": f'attachment; filename="{asset_response(asset)["folio"]}-QR.png"'})


@router.get("/{asset_id}/foto", summary="Consulta la fotografia del activo")
def get_asset_photo(asset_id: int, db: DbSession, _: Annotated[Usuario, Depends(current_user)]) -> Response:
    asset = db.get(Activo, asset_id)
    if not asset: raise HTTPException(status_code=404, detail="Activo no encontrado")
    if not asset.foto_url: raise HTTPException(status_code=404, detail="El activo no tiene fotografia")
    path = Path(asset.foto_url)
    if not path.is_file(): raise HTTPException(status_code=404, detail="La fotografia no esta disponible")
    media_types = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    return Response(path.read_bytes(), media_type=media_types.get(path.suffix.lower(), "application/octet-stream"))


@router.post("/{asset_id}/foto", response_model=ActivoRespuesta)
async def upload_asset_photo(asset_id: int, db: DbSession, _: Annotated[Usuario, Depends(require_admin)], archivo: UploadFile = File()) -> dict:
    asset = db.get(Activo, asset_id)
    if not asset: raise HTTPException(status_code=404, detail="Activo no encontrado")
    allowed = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    if archivo.content_type not in allowed: raise HTTPException(status_code=415, detail="Formato de imagen no permitido")
    content = await archivo.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024: raise HTTPException(status_code=413, detail="La foto supera 5 MB")
    folder = Path("uploads/activos"); folder.mkdir(parents=True, exist_ok=True); path = folder / f"{uuid4().hex}{allowed[archivo.content_type]}"; path.write_bytes(content)
    asset.foto_url = str(path); db.commit(); db.refresh(asset); return asset_response(asset)


@router.delete("/{asset_id}", status_code=204)
def deactivate_asset(asset_id: int, db: DbSession, _: Annotated[Usuario, Depends(require_admin)]) -> None:
    asset = db.get(Activo, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    asset.activo = False; db.commit()
