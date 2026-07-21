# SGA API

Backend del Sistema de Gestion de Activos y Auditorias para la aplicacion movil. Implementado con FastAPI, PostgreSQL, JWT, bcrypt y cifrado Fernet.

## Arranque local

Requisitos: Docker Desktop y Docker Compose.

```powershell
Copy-Item .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Coloca los dos valores generados en `JWT_SECRET_KEY` y `ENCRYPTION_KEY` del archivo `.env`, cambia las contrasenas y ejecuta:

```powershell
docker compose -p sga_movil up --build -d
docker compose -p sga_movil ps
```

- Swagger: `http://localhost:8001/docs`
- Salud: `http://localhost:8001/api/v1/health`
- PostgreSQL: `localhost:5433` (solo desarrollo; configurable con `POSTGRES_EXPOSE_PORT`)
- pgAdmin: `http://localhost:5050`

La primera llamada a `POST /api/v1/auth/registro` crea al administrador inicial. Despues de eso el registro publico queda cerrado y los usuarios se crean en `POST /api/v1/usuarios` con JWT de administrador.

## Flujo movil

1. `POST /api/v1/auth/login` obtiene access y refresh token.
2. `GET /api/v1/auditorias` muestra las auditorias asignadas.
3. `POST /api/v1/auditorias/{id}/iniciar` comienza el trabajo de campo.
4. `GET /api/v1/activos/qr/{codigo}` consulta un activo escaneado.
5. `PUT /api/v1/auditorias/{id}/qr/{codigo}/revision` registra estado, ubicacion, observacion e incidencia.
6. `POST /api/v1/auditorias/{id}/activos/{activo_id}/evidencias` adjunta una fotografia.
7. `POST /api/v1/auditorias/{id}/completar` cierra la auditoria y actualiza los activos revisados.
8. `GET /api/v1/auditorias/{id}` entrega progreso, metricas, incidencias y detalle final.

Todos los cuerpos enviados a la base de datos pasan por esquemas Pydantic. Swagger muestra los cuerpos, respuestas y codigos disponibles.

## Pruebas

```powershell
python -m pip install -r requirements.txt
python -m pytest -q
```

Las pruebas utilizan SQLite aislado y cubren autenticacion, revocacion de refresh token, permisos, validacion y el flujo completo de auditoria por QR con evidencia.

## Produccion

Consulta [DESPLIEGUE.md](docs/DESPLIEGUE.md) y [REQUISITOS_Y_SEGURIDAD.md](docs/REQUISITOS_Y_SEGURIDAD.md). El compose de produccion contiene dos replicas de API, balanceo round-robin, TLS, PostgreSQL privado, Prometheus y Grafana.

Importante: dos contenedores en un solo equipo sirven para probar balanceo, pero la evidencia academica de "dos servidores" requiere desplegarlos en dos maquinas o servicios cloud distintos. El repositorio no puede crear esos recursos sin proveedor, dominio y credenciales.
