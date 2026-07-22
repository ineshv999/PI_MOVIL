import os

os.environ.update({
    "DATABASE_URL": "sqlite:///./test.db",
    "POSTGRES_DB": "test", "POSTGRES_USER": "test", "POSTGRES_PASSWORD": "test",
    "JWT_SECRET_KEY": "test-secret-key-with-more-than-32-characters",
    "ENCRYPTION_KEY": "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=",
    "APP_ENV": "test", "EVIDENCE_DIRECTORY": "uploads/test-evidencias",
})

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.main import app
from app.models import Estatus, Rol


@pytest.fixture(autouse=True)
def database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        db.add_all([Rol(nombre="administrador"), Rol(nombre="usuario"), Estatus(nombre="Bueno"), Estatus(nombre="Malo")])
        db.commit()
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin_headers(client):
    registration = {"username": "admin", "password": "Contrasena123!", "nombres": "Admin",
                    "apellidos": "Sistema", "correo": "admin@example.com", "telefono": "4421234567",
                    "puesto": "Administrador", "edad": 30, "domicilio": "Campus UPQ, Queretaro"}
    assert client.post("/api/v1/auth/registro", json=registration).status_code == 201
    token = client.post("/api/v1/auth/login", json={"username": "admin", "password": "Contrasena123!"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
