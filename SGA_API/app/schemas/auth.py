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

    @field_validator("password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        if not any(c.isupper() for c in value) or not any(c.islower() for c in value) or not any(c.isdigit() for c in value):
            raise ValueError("La contrasena debe incluir mayuscula, minuscula y numero")
        return value


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


class UsuarioActualizar(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str | None = Field(default=None, min_length=8, max_length=72)
    nombres: str | None = Field(default=None, min_length=2, max_length=80)
    apellidos: str | None = Field(default=None, min_length=2, max_length=80)
    correo: EmailStr | None = None
    puesto: str | None = Field(default=None, min_length=2, max_length=100)
    edad: int | None = Field(default=None, ge=18, le=100)
    domicilio: str | None = Field(default=None, min_length=5, max_length=250)

    @field_validator("username", "nombres", "apellidos", mode="before")
    @classmethod
    def strip_updated_text(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value

    @field_validator("password")
    @classmethod
    def updated_password_is_strong(cls, value: str | None) -> str | None:
        if value and (not any(c.isupper() for c in value) or not any(c.islower() for c in value) or not any(c.isdigit() for c in value)):
            raise ValueError("La contrasena debe incluir mayuscula, minuscula y numero")
        return value
