def test_health_and_security_headers(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"


def test_auth_refresh_and_closed_public_registration(client, admin_headers):
    me = client.get("/api/v1/auth/me", headers=admin_headers)
    assert me.status_code == 200 and me.json()["rol"] == "administrador"
    duplicate_public = client.post("/api/v1/auth/registro", json={"username": "otro", "password": "Contrasena123!",
        "nombres": "Otro", "apellidos": "Usuario", "correo": "otro@example.com",
        "puesto": "Auditor", "edad": 25, "domicilio": "Queretaro, Queretaro"})
    assert duplicate_public.status_code == 403
    tokens = client.post("/api/v1/auth/login", json={"username": "admin", "password": "Contrasena123!"}).json()
    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refreshed.status_code == 200
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}).status_code == 401


def test_complete_mobile_audit_flow(client, admin_headers):
    user_data = {"username": "auditor", "password": "Contrasena123!", "nombres": "Ana",
                 "apellidos": "Auditora", "correo": "ana@example.com", "telefono": "4427654321",
                 "puesto": "Auditora", "edad": 28, "domicilio": "Queretaro, Queretaro"}
    user = client.post("/api/v1/usuarios", params={"rol": "usuario"}, json=user_data, headers=admin_headers)
    assert user.status_code == 201
    user_id = user.json()["id"]

    building = client.post("/api/v1/catalogos/edificios", json={"nombre": "Edificio A", "ubicacion": "Campus"}, headers=admin_headers)
    assert building.status_code == 201
    statuses = client.get("/api/v1/catalogos/estatus", headers=admin_headers).json()
    good = next(item["id"] for item in statuses if item["nombre"] == "Bueno")
    bad = next(item["id"] for item in statuses if item["nombre"] == "Malo")
    asset = client.post("/api/v1/activos", json={"codigo_qr": "QR-001", "nombre": "Laptop",
        "numero_serie": "SER-001", "edificio_id": building.json()["id"], "estatus_id": good,
        "ubicacion": "Laboratorio 1"}, headers=admin_headers)
    assert asset.status_code == 201

    audit = client.post("/api/v1/auditorias", json={"titulo": "Revision semestral", "descripcion": "Revision de activos del edificio",
        "responsable_id": user_id, "edificio_id": building.json()["id"], "ubicacion_detalle": "Laboratorio 1",
        "activo_ids": []}, headers=admin_headers)
    assert audit.status_code == 201 and audit.json()["total_activos"] == 1

    login = client.post("/api/v1/auth/login", json={"username": "auditor", "password": "Contrasena123!"}).json()
    auditor_headers = {"Authorization": f"Bearer {login['access_token']}"}
    assert client.post(f"/api/v1/auditorias/{audit.json()['id']}/iniciar", headers=auditor_headers).status_code == 200
    review = client.put(f"/api/v1/auditorias/{audit.json()['id']}/qr/QR-001/revision", json={
        "encontrado": True, "estatus_nuevo_id": bad, "ubicacion_encontrada": "Laboratorio 1",
        "observacion": "Pantalla rota durante inspeccion", "tipo_incidencia": "dano"}, headers=auditor_headers)
    assert review.status_code == 200 and review.json()["estado_revision"] == "revisado"
    evidence = client.post(f"/api/v1/auditorias/{audit.json()['id']}/activos/{asset.json()['id']}/evidencias",
        files={"archivo": ("foto.png", b"\x89PNG\r\n\x1a\ncontenido", "image/png")}, headers=auditor_headers)
    assert evidence.status_code == 201
    completed = client.post(f"/api/v1/auditorias/{audit.json()['id']}/completar", headers=auditor_headers)
    assert completed.status_code == 200 and completed.json()["estado"] == "completada"
    result = client.get(f"/api/v1/auditorias/{audit.json()['id']}", headers=auditor_headers)
    assert result.status_code == 200 and result.json()["incidencias"] == 1


def test_validations_and_permissions(client, admin_headers):
    invalid = client.post("/api/v1/activos", json={"codigo_qr": "x", "nombre": ""}, headers=admin_headers)
    assert invalid.status_code == 422
    assert client.get("/api/v1/activos").status_code in {401, 403}


def test_password_date_and_self_delete_are_protected(client, admin_headers):
    weak = {"username": "debil", "password": "sololetras", "nombres": "Usuario", "apellidos": "Debil",
            "correo": "debil@example.com", "puesto": "Auditor", "edad": 24, "domicilio": "Queretaro, Queretaro"}
    assert client.post("/api/v1/usuarios", json=weak, headers=admin_headers).status_code == 422
    me = client.get("/api/v1/auth/me", headers=admin_headers).json()
    assert client.delete(f"/api/v1/usuarios/{me['id']}", headers=admin_headers).status_code == 409


def test_review_without_changes_accepts_empty_observation(client, admin_headers):
    user_data = {"username": "auditor2", "password": "Contrasena123!", "nombres": "Luis", "apellidos": "Auditor",
                 "correo": "luis@example.com", "puesto": "Auditor", "edad": 29, "domicilio": "Queretaro, Queretaro"}
    user = client.post("/api/v1/usuarios", params={"rol": "usuario"}, json=user_data, headers=admin_headers).json()
    building = client.post("/api/v1/catalogos/edificios", json={"nombre": "Edificio B", "ubicacion": "Campus"}, headers=admin_headers).json()
    good = next(item["id"] for item in client.get("/api/v1/catalogos/estatus", headers=admin_headers).json() if item["nombre"] == "Bueno")
    asset = client.post("/api/v1/activos", json={"nombre": "Proyector", "edificio_id": building["id"], "estatus_id": good,
        "ubicacion": "Aula 1"}, headers=admin_headers).json()
    audit = client.post("/api/v1/auditorias", json={"titulo": "Revision edificio B", "descripcion": "Revision sin cambios",
        "responsable_id": user["id"], "edificio_id": building["id"], "activo_ids": []}, headers=admin_headers).json()
    login = client.post("/api/v1/auth/login", json={"username": "auditor2", "password": "Contrasena123!"}).json()
    headers = {"Authorization": f"Bearer {login['access_token']}"}
    assert client.post(f"/api/v1/auditorias/{audit['id']}/iniciar", headers=headers).status_code == 200
    response = client.put(f"/api/v1/auditorias/{audit['id']}/activos/{asset['id']}/revision", json={
        "encontrado": True, "estatus_nuevo_id": good, "ubicacion_encontrada": "Aula 1", "observacion": None,
        "tipo_incidencia": None}, headers=headers)
    assert response.status_code == 200 and response.json()["observacion"] is None
