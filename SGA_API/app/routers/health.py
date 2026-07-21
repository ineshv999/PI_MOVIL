from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine

router = APIRouter(prefix="/health", tags=["Salud"])


@router.get("", summary="Verifica que la API esté disponible")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/database", summary="Verifica la conectividad con PostgreSQL")
def database_health_check() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La base de datos no está disponible.",
        ) from exc

    return {"status": "ok", "database": "connected"}
