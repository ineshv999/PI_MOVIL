# Dockerfile para el API Gateway
FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install -r requirements.txt

# Configurar variables de entorno
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Puerto expuesto para el gateway
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "gateway:app"]