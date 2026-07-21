from pydantic import BaseModel, ConfigDict, Field


class CatalogoCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    ubicacion: str | None = Field(default=None, max_length=180)


class CatalogoRespuesta(CatalogoCrear):
    id: int
    model_config = ConfigDict(from_attributes=True)


class EstatusCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=40)


class EstatusRespuesta(EstatusCrear):
    id: int
    model_config = ConfigDict(from_attributes=True)
