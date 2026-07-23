from typing import Annotated
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
import qrcode
from sqlalchemy import delete, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import current_user, require_admin
from app.models import Activo, DetalleHistorial, Edificio, Estatus, HistorialMovimiento, Usuario
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


def add_history(db: Session, user: Usuario, asset: Activo, action: str, summary: str,
                changes: list[tuple[str, object, object]]) -> None:
    movement = HistorialMovimiento(usuario_id=user.id, activo_id=asset.id, activo_nombre=asset.nombre,
                                   ubicacion=asset.ubicacion, accion=action, resumen=summary)
    db.add(movement); db.flush()
    for field, before, after in changes:
        db.add(DetalleHistorial(historial_id=movement.id, campo=field,
                                valor_anterior=None if before is None else str(before),
                                valor_actual=None if after is None else str(after)))


@router.get("", response_model=list[ActivoRespuesta])
def list_assets(db: DbSession, _: Annotated[Usuario, Depends(current_user)], buscar: str | None = None,
                skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500)) -> list[Activo]:
    query = select(Activo)
    if buscar:
        term = f"%{buscar.strip()}%"
        query = query.where(or_(Activo.nombre.ilike(term), Activo.codigo_qr.ilike(term), Activo.numero_serie.ilike(term)))
    else:
        query = query.where(Activo.activo.is_(True))
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
def create_asset(data: ActivoCrear, db: DbSession, user: Annotated[Usuario, Depends(require_admin)]) -> Activo:
    validate_catalogs(data, db)
    values = data.model_dump()
    values["codigo_qr"] = values["codigo_qr"] or f"SGA-{uuid4().hex.upper()}"
    asset = Activo(**values)
    try:
        db.add(asset); db.flush()
        add_history(db, user, asset, "alta", "Activo registrado",
                    [("Nombre", None, asset.nombre), ("Ubicacion", None, asset.ubicacion),
                     ("Edificio", None, asset.edificio_id), ("Garantia", None, asset.garantia)])
        db.commit()
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="El codigo QR o numero de serie ya existe") from exc
    db.refresh(asset)
    return asset_response(asset)


@router.patch("/{asset_id}", response_model=ActivoRespuesta)
def update_asset(asset_id: int, data: ActivoActualizar, db: DbSession,
                 user: Annotated[Usuario, Depends(require_admin)]) -> Activo:
    asset = db.get(Activo, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    validate_catalogs(data, db)
    labels = {"nombre": "Nombre", "descripcion": "Observaciones", "numero_serie": "Numero de serie",
              "edificio_id": "Edificio", "estatus_id": "Estatus", "ubicacion": "Ubicacion",
              "garantia": "Garantia", "activo": "Activo"}
    changes = []
    for key, value in data.model_dump(exclude_unset=True).items():
        previous = getattr(asset, key)
        if previous != value: changes.append((labels.get(key, key), previous, value))
        setattr(asset, key, value)
    if changes: add_history(db, user, asset, "edicion", "Activo actualizado", changes)
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
async def upload_asset_photo(asset_id: int, db: DbSession, user: Annotated[Usuario, Depends(require_admin)], archivo: UploadFile = File()) -> dict:
    asset = db.get(Activo, asset_id)
    if not asset: raise HTTPException(status_code=404, detail="Activo no encontrado")
    allowed = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    if archivo.content_type not in allowed: raise HTTPException(status_code=415, detail="Formato de imagen no permitido")
    content = await archivo.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024: raise HTTPException(status_code=413, detail="La foto supera 5 MB")
    folder = Path("uploads/activos"); folder.mkdir(parents=True, exist_ok=True); path = folder / f"{uuid4().hex}{allowed[archivo.content_type]}"; path.write_bytes(content)
    previous = asset.foto_url; asset.foto_url = str(path)
    latest = db.scalar(select(HistorialMovimiento).where(HistorialMovimiento.activo_id == asset.id)
                       .order_by(HistorialMovimiento.creado_en.desc()).limit(1))
    if previous is None and latest and latest.accion == "alta":
        db.add(DetalleHistorial(historial_id=latest.id, campo="Fotografia",
                                valor_anterior=None, valor_actual="Fotografia registrada"))
    else:
        add_history(db, user, asset, "edicion", "Fotografia actualizada", [("Fotografia", previous, "Nueva fotografia")])
    db.commit(); db.refresh(asset); return asset_response(asset)


@router.delete("/{asset_id}", status_code=204)
def deactivate_asset(asset_id: int, db: DbSession, user: Annotated[Usuario, Depends(require_admin)]) -> None:
    asset = db.get(Activo, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    asset.activo = False
    add_history(db, user, asset, "retiro", "Activo dado de baja; se conserva el historial",
                [("Estado del activo", "Activo", "Dado de baja")])
    db.commit()


@router.delete("/{asset_id}/purga", status_code=204)
def purge_asset(asset_id: int, db: DbSession, _: Annotated[Usuario, Depends(require_admin)]) -> None:
    asset = db.get(Activo, asset_id)
    if not asset: raise HTTPException(status_code=404, detail="Activo no encontrado")
    photo_path = Path(asset.foto_url) if asset.foto_url else None
    from app.models import DetalleAuditoria, Evidencia
    detail_ids = list(db.scalars(select(DetalleAuditoria.id).where(DetalleAuditoria.activo_id == asset.id)).all())
    evidence_paths = [Path(path) for path in db.scalars(select(Evidencia.ruta).where(Evidencia.detalle_id.in_(detail_ids))).all()] if detail_ids else []
    if detail_ids:
        db.execute(delete(Evidencia).where(Evidencia.detalle_id.in_(detail_ids)))
        db.execute(delete(DetalleAuditoria).where(DetalleAuditoria.id.in_(detail_ids)))
    db.execute(delete(HistorialMovimiento).where(HistorialMovimiento.activo_id == asset.id))
    db.execute(delete(Activo).where(Activo.id == asset.id)); db.commit()
    for path in [photo_path, *evidence_paths]:
        if path:
            try: path.unlink(missing_ok=True)
            except OSError: pass
