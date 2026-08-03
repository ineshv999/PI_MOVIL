FROM grafana/grafana:11.6.3

# ===============================
# Reducir consumo de memoria
# ===============================
ENV GF_ANALYTICS_REPORTING_ENABLED=false
ENV GF_ANALYTICS_CHECK_FOR_UPDATES=false
ENV GF_ALERTING_ENABLED=false
ENV GF_UNIFIED_ALERTING_ENABLED=false
ENV GF_EXPLORE_ENABLED=false

# No instalar plugins automáticamente
ENV GF_PLUGINS_PREINSTALL_DISABLED=true

# Logs mínimos
ENV GF_LOG_LEVEL=error

# Desactivar uso compartido
ENV GF_SNAPSHOTS_EXTERNAL_ENABLED=false

# Desactivar Gravatar
ENV GF_SECURITY_DISABLE_GRAVATAR=true

# Sin telemetría
ENV GF_ANALYTICS_FEEDBACK_LINKS_ENABLED=false

# Configuración de dashboards
COPY provisioning /etc/grafana/provisioning

# Dashboards
COPY dashboards /var/lib/grafana/dashboards