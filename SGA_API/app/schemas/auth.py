from pydantic import BaseModel, EmailStr, Field, field_validator


class RegistroUsuario(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(min_length=8, max_length=72)
    nombres: str = Field(min_length=2, max_length=80)
    apellidos: str = Field(min_length=2, max_length=80)
    correo: EmailStr
    telefono: str | None = Field(default=None, max_length=25)
    puesto: str = Field(min_length=2, max_length=100)
    edad: int = Field(ge=18, le=100)
    domicilio: str = Field(min_length=5, max_length=250)

    @field_validator("username", "nombres", "apellidos", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class LoginUsuario(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=72)


class TokenRespuesta(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshSolicitud(BaseModel):
    refresh_token: str = Field(min_length=20)


class UsuarioRespuesta(BaseModel):
    id: int
    username: str
    rol: str
    nombres: str
    apellidos: str
    correo: EmailStr
    activo: bool
    puesto: str | None = None
    edad: int | None = None
    domicilio: str | None = None
    foto_url: str | None = None
