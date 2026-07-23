from typing import Annotated
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import encrypt_value, hash_password
from app.dependencies.auth import require_admin
from app.models import Activo, Auditoria, DetalleAuditoria, Evidencia, HistorialMovimiento, Persona, RefreshToken, Rol, Usuario
from app.routers.auth import serialize_user
from app.schemas.auth import RegistroUsuario, UsuarioActualizar, UsuarioRespuesta

router = APIRouter(prefix="/usuarios", tags=["Usuarios"], dependencies=[Depends(require_admin)])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[UsuarioRespuesta])
def list_users(db: DbSession) -> list[UsuarioRespuesta]:
    return [serialize_user(user) for user in db.scalars(select(Usuario).where(Usuario.activo.is_(True)).order_by(Usuario.username)).all()]


@router.post("", response_model=UsuarioRespuesta, status_code=status.HTTP_201_CREATED)
def create_user(data: RegistroUsuario, db: DbSession, rol: str = "usuario") -> UsuarioRespuesta:
    if rol not in {"usuario", "auditor", "administrador"}:
        raise HTTPException(status_code=422, detail="Rol no valido")
    if db.scalar(select(Usuario).where(Usuario.username == data.username.lower())) or db.scalar(select(Persona).where(Persona.correo == str(data.correo).lower())):
        raise HTTPException(status_code=409, detail="El usuario o correo ya existe")
    role = db.scalar(select(Rol).where(Rol.nombre == rol))
    if not role:
        role = Rol(nombre=rol); db.add(role); db.flush()
    person = Persona(nombres=data.nombres, apellidos=data.apellidos, correo=str(data.correo).lower(), puesto=data.puesto,
                     edad=data.edad, domicilio=data.domicilio,
                     telefono_cifrado=encrypt_value(data.telefono) if data.telefono else None)
    db.add(person); db.flush()
    user = Usuario(username=data.username.lower(), password_hash=hash_password(data.password), persona_id=person.id, rol_id=role.id)
    db.add(user); db.commit(); db.refresh(user)
    return serialize_user(user)


@router.patch("/{user_id}/activo", response_model=UsuarioRespuesta)
def toggle_user(user_id: int, activo: bool, db: DbSession,
                admin: Annotated[Usuario, Depends(require_admin)]) -> UsuarioRespuesta:
    user = db.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == admin.id and not activo:
        raise HTTPException(status_code=409, detail="No puedes eliminar ni desactivar la cuenta con la que iniciaste sesion")
    user.activo = activo; db.commit(); db.refresh(user)
    return serialize_user(user)


@router.post("/{user_id}/foto", response_model=UsuarioRespuesta)
async def upload_profile_photo(user_id: int, db: DbSession, archivo: UploadFile = File()) -> UsuarioRespuesta:
    user = db.get(Usuario, user_id)
    if not user: raise HTTPException(status_code=404, detail="Usuario no encontrado")
    allowed = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    if archivo.content_type not in allowed: raise HTTPException(status_code=415, detail="Formato de imagen no permitido")
    content = await archivo.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024: raise HTTPException(status_code=413, detail="La foto supera 5 MB")
    folder = Path("uploads/perfiles"); folder.mkdir(parents=True, exist_ok=True); path = folder / f"{uuid4().hex}{allowed[archivo.content_type]}"; path.write_bytes(content)
    user.persona.foto_url = str(path); db.commit(); db.refresh(user); return serialize_user(user)


@router.get("/{user_id}/foto")
def get_profile_photo(user_id: int, db: DbSession) -> Response:
    user = db.get(Usuario, user_id)
    if not user or not user.persona.foto_url:
        raise HTTPException(status_code=404, detail="El usuario no tiene fotografia")
    path = Path(user.persona.foto_url)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="La fotografia no esta disponible")
    media_types = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    return Response(path.read_bytes(), media_type=media_types.get(path.suffix.lower(), "application/octet-stream"))


@router.patch("/{user_id}", response_model=UsuarioRespuesta)
def update_user(user_id: int, data: UsuarioActualizar, db: DbSession) -> UsuarioRespuesta:
    user = db.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    values = data.model_dump(exclude_unset=True)
    username = values.pop("username", None)
    password = values.pop("password", None)
    correo = values.pop("correo", None)
    if username:
        duplicate = db.scalar(select(Usuario).where(Usuario.username == username.lower(), Usuario.id != user.id))
        if duplicate: raise HTTPException(status_code=409, detail="El nombre de usuario ya existe")
        user.username = username.lower()
    if correo:
        duplicate = db.scalar(select(Persona).where(Persona.correo == str(correo).lower(), Persona.id != user.persona_id))
        if duplicate: raise HTTPException(status_code=409, detail="El correo ya existe")
        user.persona.correo = str(correo).lower()
    if password: user.password_hash = hash_password(password)
    for key, value in values.items(): setattr(user.persona, key, value)
    db.commit(); db.refresh(user)
    return serialize_user(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: DbSession,
                admin: Annotated[Usuario, Depends(require_admin)]) -> None:
    user = db.get(Usuario, user_id)
    if not user: raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == admin.id: raise HTTPException(status_code=409, detail="No puedes eliminar la cuenta con la que iniciaste sesion")
    user.activo = False
    for token in db.scalars(select(RefreshToken).where(RefreshToken.usuario_id == user.id)).all():
        db.delete(token)
    db.commit()


@router.delete("/{user_id}/purga", status_code=status.HTTP_204_NO_CONTENT)
def purge_user(user_id: int, db: DbSession,
               admin: Annotated[Usuario, Depends(require_admin)]) -> None:
    user = db.get(Usuario, user_id)
    if not user: raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == admin.id: raise HTTPException(status_code=409, detail="No puedes purgar la cuenta con la que iniciaste sesion")
    file_paths = []
    audit_ids = list(db.scalars(select(Auditoria.id).where((Auditoria.creada_por_id == user.id) | (Auditoria.responsable_id == user.id))).all())
    owned_asset_ids = list(db.scalars(select(HistorialMovimiento.activo_id).where(HistorialMovimiento.usuario_id == user.id,
                           HistorialMovimiento.accion == "alta", HistorialMovimiento.activo_id.is_not(None))).all())
    owned_asset_ids = list(set(owned_asset_ids))
    if owned_asset_ids:
        file_paths.extend(Path(path) for path in db.scalars(select(Activo.foto_url).where(Activo.id.in_(owned_asset_ids), Activo.foto_url.is_not(None))).all())
    detail_filters = []
    if audit_ids: detail_filters.append(DetalleAuditoria.auditoria_id.in_(audit_ids))
    if owned_asset_ids: detail_filters.append(DetalleAuditoria.activo_id.in_(owned_asset_ids))
    detail_ids = []
    if detail_filters:
        condition = detail_filters[0]
        for item in detail_filters[1:]: condition = condition | item
        detail_ids = list(db.scalars(select(DetalleAuditoria.id).where(condition)).all())
    if detail_ids:
        file_paths.extend(Path(path) for path in db.scalars(select(Evidencia.ruta).where(Evidencia.detalle_id.in_(detail_ids))).all())
        db.execute(delete(Evidencia).where(Evidencia.detalle_id.in_(detail_ids)))
        db.execute(delete(DetalleAuditoria).where(DetalleAuditoria.id.in_(detail_ids)))
    db.execute(update(DetalleAuditoria).where(DetalleAuditoria.revisado_por_id == user.id).values(revisado_por_id=None))
    if audit_ids: db.execute(delete(Auditoria).where(Auditoria.id.in_(audit_ids)))
    history_filter = HistorialMovimiento.usuario_id == user.id
    if owned_asset_ids: history_filter = history_filter | HistorialMovimiento.activo_id.in_(owned_asset_ids)
    db.execute(delete(HistorialMovimiento).where(history_filter))
    if owned_asset_ids: db.execute(delete(Activo).where(Activo.id.in_(owned_asset_ids)))
    db.execute(delete(RefreshToken).where(RefreshToken.usuario_id == user.id))
    person = user.persona
    photo_path = Path(person.foto_url) if person.foto_url else None
    db.execute(delete(Usuario).where(Usuario.id == user.id))
    db.execute(delete(Persona).where(Persona.id == person.id)); db.commit()
    if photo_path:
        try:
            photo_path.unlink(missing_ok=True)
        except OSError:
            pass
    for path in file_paths:
        try: path.unlink(missing_ok=True)
        except OSError: pass
