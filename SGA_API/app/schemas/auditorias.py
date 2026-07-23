from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

EstadoAuditoria = Literal["programada", "en_progreso", "completada", "cancelada"]


class AuditoriaCrear(BaseModel):
    titulo: str = Field(min_length=3, max_length=120)
    descripcion: str | None = Field(default=None, max_length=2000)
    responsable_id: int = Field(gt=0)
    edificio_id: int = Field(gt=0)
    ubicacion_detalle: str | None = Field(default=None, max_length=180)
    fecha_programada: datetime | None = None
    activo_ids: list[int] = Field(default_factory=list, max_length=5000)

    @model_validator(mode="after")
    def fecha_no_pasada(self) -> "AuditoriaCrear":
        if self.fecha_programada:
            value = self.fecha_programada if self.fecha_programada.tzinfo else self.fecha_programada.replace(tzinfo=UTC)
            if value.date() < datetime.now(UTC).date():
                raise ValueError("La fecha programada no puede ser anterior al dia actual")
        return self


class AuditoriaActualizar(BaseModel):
    titulo: str | None = Field(default=None, min_length=3, max_length=120)
    descripcion: str | None = Field(default=None, max_length=2000)
    responsable_id: int | None = Field(default=None, gt=0)
    edificio_id: int | None = Field(default=None, gt=0)
    ubicacion_detalle: str | None = Field(default=None, max_length=180)
    fecha_programada: datetime | None = None

    @model_validator(mode="after")
    def fecha_no_pasada(self) -> "AuditoriaActualizar":
        if self.fecha_programada:
            value = self.fecha_programada if self.fecha_programada.tzinfo else self.fecha_programada.replace(tzinfo=UTC)
            if value.date() < datetime.now(UTC).date():
                raise ValueError("La fecha programada no puede ser anterior al dia actual")
        return self


class CancelarAuditoria(BaseModel):
    motivo: str = Field(min_length=5, max_length=500)


class AsignarActivos(BaseModel):
    activo_ids: list[int] = Field(min_length=1, max_length=5000)


class RevisionActivo(BaseModel):
    encontrado: bool
    estatus_nuevo_id: int = Field(gt=0)
    ubicacion_encontrada: str = Field(min_length=2, max_length=180)
    observacion: str | None = Field(default=None, max_length=2000)
    tipo_incidencia: str | None = Field(default=None, max_length=60)

    @model_validator(mode="after")
    def incidencia_requiere_observacion(self) -> "RevisionActivo":
        if self.tipo_incidencia and len((self.observacion or "").strip()) < 5:
            raise ValueError("Una incidencia requiere una observacion descriptiva")
        return self


class EvidenciaRespuesta(BaseModel):
    id: int
    nombre_archivo: str
    tipo_mime: str
    tamano_bytes: int
    sha256: str
    creada_en: datetime
    model_config = ConfigDict(from_attributes=True)


class DetalleRespuesta(BaseModel):
    id: int
    activo_id: int
    estado_revision: str
    encontrado: bool | None
    estatus_anterior_id: int | None
    estatus_nuevo_id: int | None
    ubicacion_encontrada: str | None
    observacion: str | None
    tipo_incidencia: str | None
    revisado_por_id: int | None
    registrado_en: datetime | None
    evidencias: list[EvidenciaRespuesta] = Field(default_factory=list)
    activo_nombre: str = "Activo"
    activo_folio: str = ""
    activo_ubicacion: str | None = None
    activo_foto_url: str | None = None
    model_config = ConfigDict(from_attributes=True)


class AuditoriaRespuesta(BaseModel):
    id: int
    titulo: str
    descripcion: str | None
    estado: EstadoAuditoria
    creada_por_id: int
    responsable_id: int
    responsable_nombre: str
    edificio_id: int | None
    ubicacion_detalle: str | None
    fecha_programada: datetime | None
    creada_en: datetime
    iniciada_en: datetime | None
    finalizada_en: datetime | None
    cancelada_en: datetime | None
    motivo_cancelacion: str | None
    total_activos: int = 0
    revisados: int = 0
    pendientes: int = 0
    incidencias: int = 0
    model_config = ConfigDict(from_attributes=True)


class ResultadoAuditoria(AuditoriaRespuesta):
    detalles: list[DetalleRespuesta]
