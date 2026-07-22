# Web SGA integrada

Esta carpeta contiene solamente la interfaz web Flask. No se conecta directamente a una base de datos: todas las operaciones pasan por la API FastAPI usando JWT.

La arquitectura local queda así:

- Web Flask: `http://localhost:5000`
- API FastAPI: `http://localhost:8001`
- PostgreSQL: `localhost:5433` (uso interno de la API)
- pgAdmin: `http://localhost:5050`

## Arranque

Ejecutar desde `SGA_API`:

```cmd
docker compose up -d --build
```

Para consultar el estado:

```cmd
docker compose ps
docker compose logs -f web api
```

El nombre del proyecto Compose está fijado en `sga_movil`, por lo que se reutilizan el contenedor y el volumen PostgreSQL existentes. No debe ejecutarse el antiguo Compose de esta carpeta; fue retirado junto con la conexión SQL Server.

En producción se deben definir valores robustos para `WEB_SECRET_KEY`, `JWT_SECRET_KEY`, `ENCRYPTION_KEY` y las contraseñas de PostgreSQL/pgAdmin.
