"""Inicializa las tablas y los roles base para desarrollo local.

Ejecutar: .\\venv\\Scripts\\python.exe scripts\\init_db.py
"""

import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import Base, SessionLocal, engine
from app.models import Estatus, Rol  # Importa todos los modelos antes de crear metadatos.


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        existing_roles = set(db.scalars(select(Rol.nombre)).all())
        for role_name in ("administrador", "usuario"):
            if role_name not in existing_roles:
                db.add(Rol(nombre=role_name))
        existing_statuses = set(db.scalars(select(Estatus.nombre)).all())
        for status_name in ("Excelente", "Bueno", "Regular", "Malo", "Fuera de servicio"):
            if status_name not in existing_statuses:
                db.add(Estatus(nombre=status_name))
        db.commit()
    print("Base de datos inicializada: tablas y roles disponibles.")


if __name__ == "__main__":
    main()
