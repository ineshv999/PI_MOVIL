from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.database import get_db
from app.dependencies.auth import current_user, require_admin
from app.models import Activo, Auditoria, DetalleAuditoria, Edificio, Estatus, Evidencia, Usuario
from app.schemas.auditorias import (AsignarActivos, AuditoriaActualizar, AuditoriaCrear, AuditoriaRespuesta,
                                    CancelarAuditoria, DetalleRespuesta, EvidenciaRespuesta, ResultadoAuditoria,
                                    RevisionActivo)

router = APIRouter(prefix="/auditorias", tags=["Auditorias"])
DbSession = Annotated[Session, Depends(get_db)]
settings = get_settings()


def authorized(audit: Auditoria, user: Usuario, admin_only: bool = False) -> None:
    if user.rol.nombre != "administrador" and (admin_only or audit.responsable_id != user.id):
        raise HTTPException(status_code=403, detail="No tiene permiso sobre esta auditoria")


def get_audit(audit_id: int, db: Session, with_details: bool = False) -> Auditoria:
    query = select(Auditoria).where(Auditoria.id == audit_id)
    if with_details:
        query = query.options(selectinload(Auditoria.detalles).selectinload(DetalleAuditoria.evidencias))
    audit = db.scalar(query)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoria no encontrada")
    return audit


def response(audit: Auditoria, db: Session) -> AuditoriaRespuesta:
    reviewed = sum(d.estado_revision == "revisado" for d in audit.detalles)
    incidents = sum(bool(d.tipo_incidencia) for d in audit.detalles)
    responsible = db.get(Usuario, audit.responsable_id)
    responsible_name = f"{responsible.persona.nombres} {responsible.persona.apellidos}" if responsible else "Usuario no disponible"
    return AuditoriaRespuesta.model_validate({
        **{c.name: getattr(audit, c.name) for c in audit.__table__.columns},
        "responsable_nombre": responsible_name,
        "total_activos": len(audit.detalles), "revisados": reviewed,
        "pendientes": len(audit.detalles) - reviewed, "incidencias": incidents,
    })


def add_assets(audit: Auditoria, asset_ids: list[int], db: Session) -> None:
    unique_ids = set(asset_ids)
    assets = list(db.scalars(select(Activo).where(Activo.id.in_(unique_ids), Activo.activo.is_(True))).all()) if unique_ids else []
    if len(assets) != len(unique_ids):
        raise HTTPException(status_code=422, detail="Uno o mas activos no existen o estan inactivos")
    existing = {detail.activo_id for detail in audit.detalles}
    for asset in assets:
        if asset.id not in existing:
            audit.detalles.append(DetalleAuditoria(activo_id=asset.id, estatus_anterior_id=asset.estatus_id))


@router.get("", response_model=list[AuditoriaRespuesta])
def list_audits(db: DbSession, user: Annotated[Usuario, Depends(current_user)], estado: str | None = None,
                buscar: str | None = None, skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500)) -> list[AuditoriaRespuesta]:
    query = select(Auditoria).options(selectinload(Auditoria.detalles))
    if user.rol.nombre != "administrador": query = query.where(Auditoria.responsable_id == user.id)
    if estado: query = query.where(Auditoria.estado == estado)
    if buscar: query = query.where(or_(Auditoria.titulo.ilike(f"%{buscar.strip()}%"), Auditoria.descripcion.ilike(f"%{buscar.strip()}%")))
    audits = db.scalars(query.order_by(Auditoria.creada_en.desc()).offset(skip).limit(limit)).all()
    return [response(a, db) for a in audits]


@router.post("", response_model=AuditoriaRespuesta, status_code=status.HTTP_201_CREATED)
def create_audit(data: AuditoriaCrear, db: DbSession, admin: Annotated[Usuario, Depends(require_admin)]) -> AuditoriaRespuesta:
    responsible = db.get(Usuario, data.responsable_id)
    if not responsible or not responsible.activo: raise HTTPException(status_code=422, detail="Responsable no valido")
    if not db.get(Edificio, data.edificio_id): raise HTTPException(status_code=422, detail="Edificio no valido")
    building_asset_ids = list(db.scalars(select(Activo.id).where(Activo.edificio_id == data.edificio_id, Activo.activo.is_(True))).all())
    if not building_asset_ids: raise HTTPException(status_code=422, detail="El edificio seleccionado no tiene activos disponibles")
    audit = Auditoria(titulo=data.titulo.strip(), descripcion=data.descripcion, responsable_id=data.responsable_id,
                      edificio_id=data.edificio_id, ubicacion_detalle=data.ubicacion_detalle,
                      fecha_programada=data.fecha_programada, creada_por_id=admin.id)
    db.add(audit); add_assets(audit, building_asset_ids, db); db.commit(); db.refresh(audit)
    return response(audit, db)


@router.get("/{audit_id}", response_model=ResultadoAuditoria)
def audit_detail(audit_id: int, db: DbSession, user: Annotated[Usuario, Depends(current_user)]) -> ResultadoAuditoria:
    audit = get_audit(audit_id, db, True); authorized(audit, user)
    summary = response(audit, db).model_dump()
    details = []
    for item in audit.detalles:
        asset = db.get(Activo, item.activo_id)
        details.append(DetalleRespuesta.model_validate({
            **{c.name: getattr(item, c.name) for c in item.__table__.columns},
            "evidencias": item.evidencias,
            "activo_nombre": asset.nombre if asset else "Activo eliminado",
            "activo_folio": f"ACT-{item.activo_id:06d}",
            "activo_ubicacion": asset.ubicacion if asset else None,
            "activo_foto_url": asset.foto_url if asset else None,
        }))
    return ResultadoAuditoria(**summary, detalles=details)


@router.patch("/{audit_id}", response_model=AuditoriaRespuesta)
def update_audit(audit_id: int, data: AuditoriaActualizar, db: DbSession,
                 admin: Annotated[Usuario, Depends(require_admin)]) -> AuditoriaRespuesta:
    audit = get_audit(audit_id, db, True)
    if audit.estado not in {"programada", "en_progreso"}: raise HTTPException(status_code=409, detail="El estado no permite editar")
    if data.responsable_id and not db.get(Usuario, data.responsable_id): raise HTTPException(status_code=422, detail="Responsable no valido")
    for key, value in data.model_dump(exclude_unset=True).items(): setattr(audit, key, value)
    db.commit(); db.refresh(audit); return response(audit, db)


@router.post("/{audit_id}/activos", response_model=AuditoriaRespuesta)
def assign_assets(audit_id: int, data: AsignarActivos, db: DbSession,
                  user: Annotated[Usuario, Depends(current_user)]) -> AuditoriaRespuesta:
    audit = get_audit(audit_id, db, True)
    if audit.estado not in {"programada", "en_progreso"}: raise HTTPException(status_code=409, detail="La auditoria esta cerrada")
    add_assets(audit, data.activo_ids, db)
    try: db.commit()
    except IntegrityError as exc:
        db.rollback(); raise HTTPException(status_code=409, detail="Activo ya asignado") from exc
    return response(audit, db)


@router.get("/{audit_id}/evidencias/{evidence_id}")
def get_evidence(audit_id: int, evidence_id: int, db: DbSession,
                 user: Annotated[Usuario, Depends(current_user)]) -> Response:
    audit = get_audit(audit_id, db); authorized(audit, user)
    evidence = db.scalar(select(Evidencia).join(DetalleAuditoria).where(
        Evidencia.id == evidence_id, DetalleAuditoria.auditoria_id == audit_id))
    if not evidence: raise HTTPException(status_code=404, detail="Evidencia no encontrada")
    path = Path(evidence.ruta)
    if not path.is_file(): raise HTTPException(status_code=404, detail="La evidencia no está disponible")
    return Response(path.read_bytes(), media_type=evidence.tipo_mime)


@router.delete("/{audit_id}/activos/{asset_id}", status_code=204)
def remove_asset(audit_id: int, asset_id: int, db: DbSession,
                 admin: Annotated[Usuario, Depends(require_admin)]) -> None:
    audit = get_audit(audit_id, db, True)
    if audit.estado != "programada": raise HTTPException(status_code=409, detail="Solo se puede quitar antes de iniciar")
    detail = next((d for d in audit.detalles if d.activo_id == asset_id), None)
    if not detail: raise HTTPException(status_code=404, detail="Activo no asignado")
    db.delete(detail); db.commit()


@router.post("/{audit_id}/iniciar", response_model=AuditoriaRespuesta)
def start_audit(audit_id: int, db: DbSession, user: Annotated[Usuario, Depends(current_user)]) -> AuditoriaRespuesta:
    audit = get_audit(audit_id, db, True); authorized(audit, user)
    if audit.estado != "programada": raise HTTPException(status_code=409, detail="La auditoria no esta programada")
    if not audit.detalles: raise HTTPException(status_code=409, detail="Asigne al menos un activo")
    audit.estado = "en_progreso"; audit.iniciada_en = datetime.now(UTC); db.commit(); return response(audit, db)


@router.put("/{audit_id}/activos/{asset_id}/revision", response_model=DetalleRespuesta)
def review_asset(audit_id: int, asset_id: int, data: RevisionActivo, db: DbSession,
                 user: Annotated[Usuario, Depends(current_user)]) -> DetalleAuditoria:
    audit = get_audit(audit_id, db, True); authorized(audit, user)
    if audit.estado != "en_progreso": raise HTTPException(status_code=409, detail="La auditoria no esta en progreso")
    detail = next((d for d in audit.detalles if d.activo_id == asset_id), None)
    if not detail: raise HTTPException(status_code=404, detail="Activo no asignado a la auditoria")
    if not db.get(Estatus, data.estatus_nuevo_id): raise HTTPException(status_code=422, detail="Estatus no valido")
    detail.estado_revision = "revisado"; detail.encontrado = data.encontrado
    detail.estatus_nuevo_id = data.estatus_nuevo_id; detail.ubicacion_encontrada = data.ubicacion_encontrada.strip()
    detail.observacion = data.observacion.strip() if data.observacion else None; detail.tipo_incidencia = data.tipo_incidencia
    detail.revisado_por_id = user.id; detail.registrado_en = datetime.now(UTC)
    db.commit(); db.refresh(detail); return detail


@router.put("/{audit_id}/qr/{codigo_qr}/revision", response_model=DetalleRespuesta)
def review_by_qr(audit_id: int, codigo_qr: str, data: RevisionActivo, db: DbSession,
                 user: Annotated[Usuario, Depends(current_user)]) -> DetalleAuditoria:
    asset = db.scalar(select(Activo).where(Activo.codigo_qr == codigo_qr.strip(), Activo.activo.is_(True)))
    if not asset: raise HTTPException(status_code=404, detail="Codigo QR no encontrado")
    return review_asset(audit_id, asset.id, data, db, user)


@router.post("/{audit_id}/activos/{asset_id}/evidencias", response_model=EvidenciaRespuesta, status_code=201)
async def upload_evidence(audit_id: int, asset_id: int, db: DbSession,
                          user: Annotated[Usuario, Depends(current_user)], archivo: UploadFile = File()) -> Evidencia:
    audit = get_audit(audit_id, db, True); authorized(audit, user)
    if audit.estado != "en_progreso": raise HTTPException(status_code=409, detail="La auditoria no esta en progreso")
    detail = next((d for d in audit.detalles if d.activo_id == asset_id), None)
    if not detail: raise HTTPException(status_code=404, detail="Activo no asignado")
    allowed = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    if archivo.content_type not in allowed: raise HTTPException(status_code=415, detail="Solo se permiten imagenes JPEG, PNG o WebP")
    content = await archivo.read(settings.max_evidence_size_mb * 1024 * 1024 + 1)
    if len(content) > settings.max_evidence_size_mb * 1024 * 1024: raise HTTPException(status_code=413, detail="Archivo demasiado grande")
    if not content: raise HTTPException(status_code=422, detail="El archivo esta vacio")
    directory = Path(settings.evidence_directory) / str(audit_id); directory.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid4().hex}{allowed[archivo.content_type]}"; path = directory / safe_name
    path.write_bytes(content)
    evidence = Evidencia(detalle_id=detail.id, nombre_archivo=archivo.filename or safe_name, ruta=str(path),
                         tipo_mime=archivo.content_type, tamano_bytes=len(content), sha256=sha256(content).hexdigest())
    db.add(evidence); db.commit(); db.refresh(evidence); return evidence


@router.post("/{audit_id}/completar", response_model=AuditoriaRespuesta)
def complete_audit(audit_id: int, db: DbSession, user: Annotated[Usuario, Depends(current_user)]) -> AuditoriaRespuesta:
    audit = get_audit(audit_id, db, True); authorized(audit, user)
    if audit.estado != "en_progreso": raise HTTPException(status_code=409, detail="La auditoria no esta en progreso")
    audit.estado = "completada"; audit.finalizada_en = datetime.now(UTC)
    for detail in audit.detalles:
        if detail.estado_revision == "pendiente": detail.estado_revision = "no_revisado"
        elif detail.estatus_nuevo_id:
            asset = db.get(Activo, detail.activo_id); asset.estatus_id = detail.estatus_nuevo_id
            if detail.ubicacion_encontrada: asset.ubicacion = detail.ubicacion_encontrada
    db.commit(); return response(audit, db)


@router.post("/{audit_id}/cancelar", response_model=AuditoriaRespuesta)
def cancel_audit(audit_id: int, data: CancelarAuditoria, db: DbSession,
                 user: Annotated[Usuario, Depends(current_user)]) -> AuditoriaRespuesta:
    audit = get_audit(audit_id, db, True); authorized(audit, user)
    if audit.estado not in {"programada", "en_progreso"}: raise HTTPException(status_code=409, detail="La auditoria ya esta cerrada")
    audit.estado = "cancelada"; audit.cancelada_en = datetime.now(UTC); audit.motivo_cancelacion = data.motivo.strip()
    db.commit(); return response(audit, db)


@router.delete("/{audit_id}", status_code=204)
def delete_audit(audit_id: int, db: DbSession, admin: Annotated[Usuario, Depends(require_admin)]) -> None:
    audit = get_audit(audit_id, db, True)
    evidence_paths = [Path(evidence.ruta) for detail in audit.detalles for evidence in detail.evidencias]
    db.delete(audit); db.commit()
    for path in evidence_paths:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass
    try:
        (Path(settings.evidence_directory) / str(audit_id)).rmdir()
    except OSError:
        pass
