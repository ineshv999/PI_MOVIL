# Matriz de validaciones

Todas las operaciones se validan primero en la interfaz y nuevamente mediante Pydantic y reglas de negocio en la API.

| Interfaz | Validaciones principales | Confirmacion/resultado |
|---|---|---|
| Login | usuario y contrasena obligatorios; credenciales invalidas | alerta contextual |
| Registrar usuario | nombre y apellido, puesto, edad 18-100, domicilio, correo, rol, contrasena fuerte, confirmacion, foto <= 5 MB | modal de registro exitoso |
| Registrar activo | nombre, edificio, tipo/detalle de ubicacion, garantia y periodo, foto <= 5 MB | modal con folio y QR |
| Crear auditoria | titulo, descripcion, fecha no pasada, responsable activo, edificio con activos, detalle <= 180 | modal de auditoria registrada |
| Editar auditoria | titulo, descripcion, fecha no pasada, responsable y edificio | modal de cambios guardados |
| Revisar activo | estado y ubicacion; observacion >= 5 si cambia el estado; evidencia <= 5 MB | confirmacion antes de enviar y alerta de exito |
| Cancelar auditoria | motivo obligatorio de al menos 5 caracteres | modal destructivo |
| Agregar activo | seleccion obligatoria; evita duplicados | error de API visible |
| Eliminar usuario/auditoria | confirmacion, permisos de administrador y proteccion de cuenta actual | modal destructivo |

Los errores de campos se muestran en rojo debajo del control. Los errores de red, permisos o reglas de negocio se muestran en una alerta general sin ocultarlos como errores de conexion.
