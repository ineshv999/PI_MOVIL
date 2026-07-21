from pydantic import BaseModel, Field


class ActivoCrear(BaseModel):
    codigo_qr: str = Field(min_length=3, max_length=120)
    nombre: str = Field(min_length=2, max_length=120)
    descripcion: str | None = Field(default=None, max_length=2000)
    numero_serie: str | None = Field(default=None, max_length=100)
    edificio_id: int | None = Field(default=None, gt=0)
    estatus_id: int | None = Field(default=None, gt=0)


class ActivoRespuesta(ActivoCrear):
    id: int
