from pydantic import BaseModel, Field


class RegistroUsuario(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(min_length=8, max_length=72)
    nombres: str = Field(min_length=2, max_length=80)
    apellidos: str = Field(min_length=2, max_length=80)
    correo: str = Field(min_length=5, max_length=120)
    telefono: str | None = Field(default=None, max_length=25)


class LoginUsuario(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=72)


class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsuarioRespuesta(BaseModel):
    id: int
    username: str
    rol: str
    nombres: str
    apellidos: str
