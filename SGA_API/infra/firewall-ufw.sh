#!/usr/bin/env sh
set -eu
# Ejecutar como root solamente en el servidor publico Ubuntu/Debian.
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment SSH
ufw allow 80/tcp comment HTTP
ufw allow 443/tcp comment HTTPS
ufw logging medium
ufw --force enable
ufw status verbose
