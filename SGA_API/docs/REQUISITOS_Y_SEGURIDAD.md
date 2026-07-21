# Evidencia de requisitos del PI

## Implementado en código

| Requisito | Evidencia |
|---|---|
| API propia y base de datos | FastAPI + PostgreSQL, `docker-compose.yml` y modelos SQLAlchemy. |
| Validación de datos | Esquemas Pydantic en `app/schemas/`; las entradas inválidas devuelven 422. |
| JWT | `POST /api/v1/auth/login` genera un token y las rutas de activos requieren `Authorization: Bearer <token>`. |
| Hash de contraseñas | `app/core/security.py` usa bcrypt con salt. Nunca se guarda la contraseña original. |
| Cifrado | Los teléfonos se guardan con Fernet; la llave se toma de `ENCRYPTION_KEY`. |
| Roles | Registro crea el rol `usuario`; creación de activos requiere `administrador`. |
| Consulta QR móvil | `GET /api/v1/activos/qr/{codigo_qr}` está pensada para la cámara de React Native. |
| Salud y monitoreo básico | `/api/v1/health` y `/api/v1/health/database` sirven para UptimeRobot, Better Stack o un monitor del proveedor. |

## Despliegue seguro

`docker-compose.production.yml` separa los servicios así:

```text
Internet -> Caddy (servidor público, 80/443, SSL) -> API (red privada) -> PostgreSQL (red privada)
```

Caddy actúa como proxy inverso y termina TLS. PostgreSQL no publica puertos y solo se comunica por la red `private`. Para un balanceador administrado, despliega dos o más réplicas de `api` detrás de un Load Balancer del proveedor (Render, Railway, AWS ALB, Azure Application Gateway o DigitalOcean).

## Operación requerida antes de entregar

1. Define un dominio real en `infra/Caddyfile`; Caddy emitirá SSL automáticamente.
2. En el firewall del proveedor permite únicamente TCP 80 y 443 al servidor público; bloquea 5432 desde Internet.
3. Guarda `.env` solo como secreto del proveedor; genera nuevas llaves con `Fernet.generate_key()` y una clave JWT de al menos 32 bytes.
4. Configura un monitor externo contra `/api/v1/health` y una alerta si recibe un estado distinto de 200.
5. Añade evidencia: capturas de Swagger, contenedores en ejecución, reglas del firewall, certificado HTTPS y panel/alerta de monitoreo.

## Alcance pendiente fuera de este repositorio

La carpeta actual no contiene la aplicación React Native ni el sitio web. Para acreditar los requisitos móviles aún hay que incorporar ese código y conectarlo a estas rutas; la API no puede sustituir esas interfaces ni demostrar navegación en dispositivos por sí sola.
