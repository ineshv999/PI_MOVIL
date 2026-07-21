# Despliegue seguro

## Arquitectura

```text
Internet
   |
Firewall: 80/443
   |
Servidor publico: Caddy + TLS + balanceador
   |-----------------------|
Servidor privado API 1     Servidor privado API 2
   |-----------------------|
       PostgreSQL privado
       Prometheus/Grafana privados
```

`docker-compose.production.yml` reproduce esta separacion mediante redes y dos replicas para una demostracion local. Para cumplir literalmente con dos servidores, ubica Caddy en una VM publica y las APIs/BD en una red privada del proveedor. No asignes IP publica a PostgreSQL.

## Preparacion

1. Registra un dominio y cambia `api.tu-dominio.com` en `infra/Caddyfile`.
2. Crea un `.env` fuera de Git con contrasenas distintas, una clave JWT aleatoria, llave Fernet valida y origenes CORS exactos.
3. En el firewall cloud abre 80/443 al mundo y 22 solo a la IP administrativa. Permite el puerto interno 8000 exclusivamente desde el balanceador y 5432 exclusivamente desde las APIs.
4. Inicia servicios con `docker compose --env-file .env -f docker-compose.production.yml up --build -d`.
5. Comprueba `https://DOMINIO/api/v1/health`, el certificado y los logs.
6. Accede a Grafana solamente mediante VPN, tunel SSH o un proxy protegido; no se publica su puerto.

## Secretos

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

No reutilices los valores de `.env.example`. En un proveedor utiliza su gestor de secretos. Haz respaldo de `ENCRYPTION_KEY`: perderla impide descifrar los datos existentes.

## Firewall y monitoreo

En Ubuntu, revisa y ejecuta `infra/firewall-ufw.sh` como administrador. El script activa registro de eventos UFW; supervisalos con `journalctl -k -g UFW --since today` y conecta esos logs al servicio de alertas del proveedor. Prometheus consulta ambas replicas cada 15 segundos. Configura en Grafana una alerta cuando `up{job="sga-api"} == 0` o cuando aumenten las respuestas 5xx.
