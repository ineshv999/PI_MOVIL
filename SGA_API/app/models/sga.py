from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Rol(Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="rol")


class Persona(Base):
    __tablename__ = "personas"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombres: Mapped[str] = mapped_column(String(80))
    apellidos: Mapped[str] = mapped_column(String(80))
    correo: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    telefono_cifrado: Mapped[str | None] = mapped_column(String(255), nullable=True)
    puesto: Mapped[str | None] = mapped_column(String(100), nullable=True)
    edad: Mapped[int | None] = mapped_column(Integer, nullable=True)
    domicilio: Mapped[str | None] = mapped_column(String(250), nullable=True)
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    usuario: Mapped["Usuario | None"] = relationship(back_populates="persona", uselist=False)


class Usuario(Base):
    __tablename__ = "usuarios"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    persona_id: Mapped[int] = mapped_column(ForeignKey("personas.id"), unique=True)
    rol_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))
    persona: Mapped[Persona] = relationship(back_populates="usuario")
    rol: Mapped[Rol] = relationship(back_populates="usuarios")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[int] = mapped_column(primary_key=True)
    jti_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    expira_en: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revocado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Edificio(Base):
    __tablename__ = "edificios"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True)
    ubicacion: Mapped[str | None] = mapped_column(String(180), nullable=True)


class Estatus(Base):
    __tablename__ = "estatus"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(40), unique=True)


class Activo(Base):
    __tablename__ = "activos"
    id: Mapped[int] = mapped_column(primary_key=True)
    codigo_qr: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(120))
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    numero_serie: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    edificio_id: Mapped[int | None] = mapped_column(ForeignKey("edificios.id"), nullable=True)
    estatus_id: Mapped[int | None] = mapped_column(ForeignKey("estatus.id"), nullable=True)
    ubicacion: Mapped[str | None] = mapped_column(String(180), nullable=True)
    garantia: Mapped[str | None] = mapped_column(String(120), nullable=True)
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Auditoria(Base):
    __tablename__ = "auditorias"
    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(120))
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(30), default="programada", index=True)
    creada_por_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    responsable_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    edificio_id: Mapped[int | None] = mapped_column(ForeignKey("edificios.id"), nullable=True)
    ubicacion_detalle: Mapped[str | None] = mapped_column(String(180), nullable=True)
    fecha_programada: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    iniciada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finalizada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    motivo_cancelacion: Mapped[str | None] = mapped_column(String(500), nullable=True)
    detalles: Mapped[list["DetalleAuditoria"]] = relationship(back_populates="auditoria", cascade="all, delete-orphan")


class DetalleAuditoria(Base):
    __tablename__ = "detalle_auditoria"
    __table_args__ = (UniqueConstraint("auditoria_id", "activo_id", name="uq_auditoria_activo"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    auditoria_id: Mapped[int] = mapped_column(ForeignKey("auditorias.id"))
    activo_id: Mapped[int] = mapped_column(ForeignKey("activos.id"))
    estado_revision: Mapped[str] = mapped_column(String(30), default="pendiente", index=True)
    encontrado: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    estatus_anterior_id: Mapped[int | None] = mapped_column(ForeignKey("estatus.id"), nullable=True)
    estatus_nuevo_id: Mapped[int | None] = mapped_column(ForeignKey("estatus.id"), nullable=True)
    ubicacion_encontrada: Mapped[str | None] = mapped_column(String(180), nullable=True)
    observacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    tipo_incidencia: Mapped[str | None] = mapped_column(String(60), nullable=True)
    revisado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    registrado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    auditoria: Mapped[Auditoria] = relationship(back_populates="detalles")
    evidencias: Mapped[list["Evidencia"]] = relationship(back_populates="detalle", cascade="all, delete-orphan")


class Evidencia(Base):
    __tablename__ = "evidencias"
    id: Mapped[int] = mapped_column(primary_key=True)
    detalle_id: Mapped[int] = mapped_column(ForeignKey("detalle_auditoria.id", ondelete="CASCADE"), index=True)
    nombre_archivo: Mapped[str] = mapped_column(String(255))
    ruta: Mapped[str] = mapped_column(String(500))
    tipo_mime: Mapped[str] = mapped_column(String(80))
    tamano_bytes: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64))
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    detalle: Mapped[DetalleAuditoria] = relationship(back_populates="evidencias")
