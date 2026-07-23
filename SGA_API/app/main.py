from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from starlette.responses import Response

from app.core.config import get_settings
from app.core.observability import SecurityAndMetricsMiddleware
from app.routers import activos, auditorias, auth, catalogos, health, movimientos, usuarios

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API para el Sistema de Gestión de Activos y Auditorías.",
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(SecurityAndMetricsMiddleware)

app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(activos.router, prefix=settings.api_v1_prefix)
app.include_router(catalogos.router, prefix=settings.api_v1_prefix)
app.include_router(usuarios.router, prefix=settings.api_v1_prefix)
app.include_router(auditorias.router, prefix=settings.api_v1_prefix)
app.include_router(movimientos.router, prefix=settings.api_v1_prefix)


@app.get("/metrics", include_in_schema=False)
def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/", tags=["General"], summary="Mensaje de bienvenida")
def root() -> dict[str, str]:
    return {"message": "Bienvenido a la API del SGA"}
