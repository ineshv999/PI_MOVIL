# SGA API

API para el Sistema de Gestión de Activos y Auditorías, creada con FastAPI y PostgreSQL.

## Arranque local

1. Copia `.env.example` a `.env` y define contraseñas locales seguras.
2. Inicia PostgreSQL y pgAdmin:

   ```powershell
   docker compose up -d
   ```

3. Crea las tablas y roles iniciales:

   ```powershell
   .\venv\Scripts\python.exe scripts\init_db.py
   ```

4. Activa el entorno virtual e inicia la API:

   ```powershell
   .\venv\Scripts\Activate.ps1
   uvicorn app.main:app --reload
   ```

La documentación estará en `http://127.0.0.1:8001/docs` cuando uses Docker (o en el puerto 8000 si ejecutas Uvicorn directamente).

## Comprobaciones

- `GET /api/v1/health`: API disponible.
- `GET /api/v1/health/database`: API y PostgreSQL conectados.
- pgAdmin: `http://localhost:5050`.

Al registrar el servidor en pgAdmin usa `postgres` como host si lo haces desde el contenedor de pgAdmin, o `localhost` desde tu equipo.

## Seguridad inicial

Las credenciales no se versionan: `.env` está excluido de Git. La API incluye bcrypt, JWT, cifrado Fernet de datos sensibles, roles y validaciones Pydantic. Consulta [la matriz de requisitos](docs/REQUISITOS_Y_SEGURIDAD.md) para el despliegue con SSL, firewall, monitoreo y redes pública/privada.

## Rutas principales

- `POST /api/v1/auth/registro`: crea una cuenta de auditor.
- `POST /api/v1/auth/login`: entrega un JWT.
- `GET /api/v1/auth/me`: consulta el usuario autenticado.
- `GET /api/v1/activos` y `GET /api/v1/activos/qr/{codigo_qr}`: consumo para la aplicación móvil.
- `POST /api/v1/activos`: solo administradores.
