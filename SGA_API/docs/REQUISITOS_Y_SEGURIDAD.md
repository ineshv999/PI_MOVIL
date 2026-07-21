# Matriz de cumplimiento

| Requisito | Implementacion verificable |
|---|---|
| API propia y BD | FastAPI, PostgreSQL, modelos SQLAlchemy y Docker Compose. |
| Validacion obligatoria | Esquemas Pydantic en `app/schemas`; referencias a edificios, estatus, usuarios y activos se comprueban antes de guardar. |
| Funcion movil diferenciada | Auditoria en campo mediante QR, ubicacion encontrada, estado fisico, observacion obligatoria, incidencias y fotografias. |
| JWT | Access token corto, refresh token rotatorio almacenado como hash, revocacion en logout y autorizacion por roles. |
| Hash | bcrypt con salt para contrasenas; SHA-256 para integridad de evidencias y almacenamiento de identificadores de refresh token. |
| Cifrado | Fernet cifra telefonos en reposo; TLS de Caddy cifra el trafico. Las llaves se cargan desde secretos. |
| Servidor publico y privado | Caddy pertenece a redes publica/privada; API, PostgreSQL, Prometheus y Grafana solo a la privada. Para acreditar dos servidores fisicos se sigue `DESPLIEGUE.md`. |
| Monitoreo | Health checks, `/metrics`, Prometheus y Grafana en la red privada. |
| Firewall | Solo se publican 80/443 en produccion; `infra/firewall-ufw.sh` aplica deny-by-default y abre SSH/HTTP/HTTPS. PostgreSQL no publica 5432. |
| SSL | Caddy obtiene y renueva certificados al configurar un dominio real. HSTS y cabeceras defensivas habilitadas. |
| Balanceador | Caddy distribuye round-robin entre `api1` y `api2`, con health checks y retiro temporal de instancias fallidas. |

## Evidencia que debe capturarse en la nube

- DNS del dominio apuntando al servidor publico.
- Candado HTTPS y detalle del certificado valido.
- Reglas del firewall/security group, sin puerto 5432 publico.
- Dos instancias sanas y peticiones repartidas por el balanceador.
- Dashboard de Prometheus/Grafana y una alerta de disponibilidad.
- Swagger realizando login, consulta QR y cierre de una auditoria.
- Base de datos accesible desde la red privada y rechazada desde Internet.

La configuracion existe en el repositorio, pero SSL, firewall cloud, alojamiento y dos servidores reales solo pueden demostrarse despues de desplegar con un dominio y una cuenta de proveedor.
