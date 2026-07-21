from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, encrypt_value, hash_password, verify_password
from app.dependencies.auth import current_user
from app.models import Persona, Rol, Usuario
from app.schemas.auth import LoginUsuario, RegistroUsuario, TokenRespuesta, UsuarioRespuesta

router = APIRouter(prefix="/auth", tags=["Autenticación"])
DbSession = Annotated[Session, Depends(get_db)]


def serialize_user(user: Usuario) -> UsuarioRespuesta:
    return UsuarioRespuesta(id=user.id, username=user.username, rol=user.rol.nombre, nombres=user.persona.nombres, apellidos=user.persona.apellidos)


@router.post("/registro", response_model=UsuarioRespuesta, status_code=status.HTTP_201_CREATED)
def register(data: RegistroUsuario, db: DbSession) -> UsuarioRespuesta:
    exists = db.scalar(select(Usuario).where(Usuario.username == data.username)) or db.scalar(select(Persona).where(Persona.correo == data.correo))
    if exists:
        raise HTTPException(status_code=409, detail="El usuario o correo ya existe")
    role = db.scalar(select(Rol).where(Rol.nombre == "usuario"))
    if not role:
        role = Rol(nombre="usuario")
        db.add(role)
        db.flush()
    persona = Persona(nombres=data.nombres, apellidos=data.apellidos, correo=data.correo, telefono_cifrado=encrypt_value(data.telefono) if data.telefono else None)
    db.add(persona)
    db.flush()
    user = Usuario(username=data.username, password_hash=hash_password(data.password), persona_id=persona.id, rol_id=role.id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.post("/login", response_model=TokenRespuesta)
def login(data: LoginUsuario, db: DbSession) -> TokenRespuesta:
    user = db.scalar(select(Usuario).where(Usuario.username == data.username))
    if not user or not user.activo or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    return TokenRespuesta(access_token=create_access_token(str(user.id), user.rol.nombre))


@router.get("/me", response_model=UsuarioRespuesta)
def me(user: Annotated[Usuario, Depends(current_user)]) -> UsuarioRespuesta:
    return serialize_user(user)
