from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ActivoCrear(BaseModel):
    codigo_qr: str | None = Field(default=None, min_length=3, max_length=120)
    nombre: str = Field(min_length=2, max_length=120)
    descripcion: str | None = Field(default=None, max_length=2000)
    numero_serie: str | None = Field(default=None, max_length=100)
    edificio_id: int | None = Field(default=None, gt=0)
    estatus_id: int | None = Field(default=None, gt=0)
    ubicacion: str | None = Field(default=None, max_length=180)
    garantia: str | None = Field(default=None, max_length=120)
    foto_url: str | None = Field(default=None, max_length=500)

    @field_validator("nombre", mode="before")
    @classmethod
    def strip_required(cls, value: str) -> str:
        return value.strip()

    @field_validator("codigo_qr", mode="before")
    @classmethod
    def strip_optional_qr(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value


class ActivoActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=120)
    descripcion: str | None = Field(default=None, max_length=2000)
    numero_serie: str | None = Field(default=None, max_length=100)
    edificio_id: int | None = Field(default=None, gt=0)
    estatus_id: int | None = Field(default=None, gt=0)
    ubicacion: str | None = Field(default=None, max_length=180)
    garantia: str | None = Field(default=None, max_length=120)
    foto_url: str | None = Field(default=None, max_length=500)
    activo: bool | None = None


class ActivoRespuesta(ActivoCrear):
    id: int
    folio: str
    activo: bool
    creado_en: datetime
    model_config = ConfigDict(from_attributes=True)
