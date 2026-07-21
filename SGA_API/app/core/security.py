from datetime import UTC, datetime, timedelta
from hashlib import sha256
from uuid import uuid4

import bcrypt
from cryptography.fernet import Fernet
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()
fernet = Fernet(settings.encryption_key.encode())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(subject: str, role: str) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "role": role, "type": "access", "exp": expires_at, "jti": str(uuid4())}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> tuple[str, str, datetime]:
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    jti = str(uuid4())
    token = jwt.encode({"sub": subject, "type": "refresh", "exp": expires_at, "jti": jti}, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, hash_token_id(jti), expires_at


def _decode_typed_token(token: str, expected_type: str) -> dict[str, str]:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != expected_type:
            raise ValueError("Tipo de token incorrecto")
        return payload
    except JWTError as exc:
        raise ValueError("Token invalido o expirado") from exc


def decode_access_token(token: str) -> dict[str, str]:
    return _decode_typed_token(token, "access")


def decode_refresh_token(token: str) -> dict[str, str]:
    return _decode_typed_token(token, "refresh")


def hash_token_id(jti: str) -> str:
    return sha256(jti.encode()).hexdigest()


def encrypt_value(value: str) -> str:
    return fernet.encrypt(value.encode()).decode()


def decrypt_value(value: str) -> str:
    return fernet.decrypt(value.encode()).decode()
