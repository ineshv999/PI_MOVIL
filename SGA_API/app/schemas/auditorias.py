from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

EstadoAuditoria = Literal["programada", "en_progreso", "completada", "cancelada"]


class AuditoriaCrear(BaseModel):
    titulo: str = Field(min_length=3, max_length=120)
    descripcion: str | None = Field(default=None, max_length=2000)
    responsable_id: int = Field(gt=0)
    fecha_programada: datetime | None = None
    activo_ids: list[int] = Field(default_factory=list, max_length=5000)


class AuditoriaActualizar(BaseModel):
    titulo: str | None = Field(default=None, min_length=3, max_length=120)
    descripcion: str | None = Field(default=None, max_length=2000)
    responsable_id: int | None = Field(default=None, gt=0)
    fecha_programada: datetime | None = None


class CancelarAuditoria(BaseModel):
    motivo: str = Field(min_length=5, max_length=500)


class AsignarActivos(BaseModel):
    activo_ids: list[int] = Field(min_length=1, max_length=5000)


class RevisionActivo(BaseModel):
    encontrado: bool
    estatus_nuevo_id: int = Field(gt=0)
    ubicacion_encontrada: str = Field(min_length=2, max_length=180)
    observacion: str = Field(min_length=3, max_length=2000)
    tipo_incidencia: str | None = Field(default=None, max_length=60)

    @model_validator(mode="after")
    def incidencia_requiere_observacion(self) -> "RevisionActivo":
        if self.tipo_incidencia and len(self.observacion.strip()) < 5:
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
    model_config = ConfigDict(from_attributes=True)


class AuditoriaRespuesta(BaseModel):
    id: int
    titulo: str
    descripcion: str | None
    estado: EstadoAuditoria
    creada_por_id: int
    responsable_id: int
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
