# Evidencia de hash, cifrado y JWT

Ejecutar `venv\Scripts\python.exe scripts\demo_security.py` y capturar la salida.

- bcrypt: genera hashes con salt; dos ejecuciones producen hashes distintos y ambos verifican la misma contrasena.
- Fernet: el valor guardado no revela el telefono y solo puede recuperarse con la llave del servidor.
- SHA-256: protege la integridad de evidencias y oculta el identificador de refresh tokens almacenado.
- JWT: contiene sujeto, rol, tipo, expiracion y JTI; la firma se valida antes de autorizar la solicitud.

No mostrar `.env`, `JWT_SECRET_KEY`, `ENCRYPTION_KEY`, contrasenas reales ni tokens completos durante la presentacion.
