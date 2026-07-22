from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.observability import login_limiter
from app.core.security import (create_access_token, create_refresh_token, decode_refresh_token,
                               encrypt_value, hash_password, hash_token_id, verify_password)
from app.dependencies.auth import current_user
from app.models import Persona, RefreshToken, Rol, Usuario
from app.schemas.auth import LoginUsuario, RefreshSolicitud, RegistroUsuario, TokenRespuesta, UsuarioRespuesta

router = APIRouter(prefix="/auth", tags=["Autenticacion"])
DbSession = Annotated[Session, Depends(get_db)]


def serialize_user(user: Usuario) -> UsuarioRespuesta:
    return UsuarioRespuesta(id=user.id, username=user.username, rol=user.rol.nombre,
                            nombres=user.persona.nombres, apellidos=user.persona.apellidos,
                            correo=user.persona.correo, activo=user.activo, puesto=user.persona.puesto,
                            edad=user.persona.edad, domicilio=user.persona.domicilio, foto_url=user.persona.foto_url)


def issue_tokens(user: Usuario, db: Session) -> TokenRespuesta:
    refresh, jti_hash, expires = create_refresh_token(str(user.id))
    db.add(RefreshToken(jti_hash=jti_hash, usuario_id=user.id, expira_en=expires))
    db.commit()
    return TokenRespuesta(access_token=create_access_token(str(user.id), user.rol.nombre), refresh_token=refresh)


@router.post("/registro", response_model=UsuarioRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Crea solamente la primera cuenta del sistema")
def register(data: RegistroUsuario, db: DbSession) -> UsuarioRespuesta:
    if db.scalar(select(Usuario.id).limit(1)) is not None:
        raise HTTPException(status_code=403, detail="El registro publico esta cerrado; un administrador debe crear la cuenta")
    role = db.scalar(select(Rol).where(Rol.nombre == "administrador"))
    if not role:
        role = Rol(nombre="administrador")
        db.add(role)
        db.flush()
    persona = Persona(nombres=data.nombres, apellidos=data.apellidos, correo=str(data.correo).lower(), puesto=data.puesto,
                      edad=data.edad, domicilio=data.domicilio, telefono_cifrado=encrypt_value(data.telefono) if data.telefono else None)
    db.add(persona)
    db.flush()
    user = Usuario(username=data.username.lower(), password_hash=hash_password(data.password),
                   persona_id=persona.id, rol_id=role.id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.post("/login", response_model=TokenRespuesta)
def login(data: LoginUsuario, db: DbSession, request: Request) -> TokenRespuesta:
    login_limiter.check(request)
    user = db.scalar(select(Usuario).where(Usuario.username == data.username.lower()))
    if not user or not user.activo or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")
    return issue_tokens(user, db)


@router.post("/refresh", response_model=TokenRespuesta)
def refresh(data: RefreshSolicitud, db: DbSession) -> TokenRespuesta:
    try:
        payload = decode_refresh_token(data.refresh_token)
        token = db.scalar(select(RefreshToken).where(RefreshToken.jti_hash == hash_token_id(payload["jti"])))
        user = db.get(Usuario, int(payload["sub"]))
    except (KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Refresh token invalido")
    if not token or token.revocado_en or not user or not user.activo:
        raise HTTPException(status_code=401, detail="Refresh token revocado")
    token.revocado_en = datetime.now(UTC)
    return issue_tokens(user, db)


@router.post("/logout", status_code=204)
def logout(data: RefreshSolicitud, db: DbSession) -> None:
    try:
        payload = decode_refresh_token(data.refresh_token)
        token = db.scalar(select(RefreshToken).where(RefreshToken.jti_hash == hash_token_id(payload["jti"])))
    except (KeyError, ValueError):
        token = None
    if token and not token.revocado_en:
        token.revocado_en = datetime.now(UTC)
        db.commit()


@router.get("/me", response_model=UsuarioRespuesta)
def me(user: Annotated[Usuario, Depends(current_user)]) -> UsuarioRespuesta:
    return serialize_user(user)
