from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import encrypt_value, hash_password
from app.dependencies.auth import require_admin
from app.models import Persona, Rol, Usuario
from app.routers.auth import serialize_user
from app.schemas.auth import RegistroUsuario, UsuarioRespuesta

router = APIRouter(prefix="/usuarios", tags=["Usuarios"], dependencies=[Depends(require_admin)])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[UsuarioRespuesta])
def list_users(db: DbSession) -> list[UsuarioRespuesta]:
    return [serialize_user(user) for user in db.scalars(select(Usuario).order_by(Usuario.username)).all()]


@router.post("", response_model=UsuarioRespuesta, status_code=status.HTTP_201_CREATED)
def create_user(data: RegistroUsuario, db: DbSession, rol: str = "usuario") -> UsuarioRespuesta:
    if rol not in {"usuario", "administrador"}:
        raise HTTPException(status_code=422, detail="Rol no valido")
    if db.scalar(select(Usuario).where(Usuario.username == data.username.lower())) or db.scalar(select(Persona).where(Persona.correo == str(data.correo).lower())):
        raise HTTPException(status_code=409, detail="El usuario o correo ya existe")
    role = db.scalar(select(Rol).where(Rol.nombre == rol))
    person = Persona(nombres=data.nombres, apellidos=data.apellidos, correo=str(data.correo).lower(),
                     telefono_cifrado=encrypt_value(data.telefono) if data.telefono else None)
    db.add(person); db.flush()
    user = Usuario(username=data.username.lower(), password_hash=hash_password(data.password), persona_id=person.id, rol_id=role.id)
    db.add(user); db.commit(); db.refresh(user)
    return serialize_user(user)


@router.patch("/{user_id}/activo", response_model=UsuarioRespuesta)
def toggle_user(user_id: int, activo: bool, db: DbSession) -> UsuarioRespuesta:
    user = db.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.activo = activo; db.commit(); db.refresh(user)
    return serialize_user(user)
