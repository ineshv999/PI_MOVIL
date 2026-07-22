# SGAFAQ Movil

Aplicacion Expo SDK 54 conectada a la API propia SGA. Conserva las interfaces del proyecto y utiliza datos reales de PostgreSQL.

## Web

Con la API Docker activa en el puerto 8001:

```cmd
npm install
npm run web
```

Abre `http://localhost:8081`. La URL predeterminada de la API para web es `http://localhost:8001/api/v1`.

## Telefono con Expo Go

El telefono y la computadora deben estar en la misma red Wi-Fi. Copia `.env.example` como `.env` y usa la IPv4 de la computadora, por ejemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.7:8001/api/v1
```

Reinicia Metro con `npx expo start --clear`, abre Expo Go y escanea el QR de Expo. Si la IP cambia, actualiza `.env`. En produccion utiliza exclusivamente la URL HTTPS del dominio desplegado.

## Funciones conectadas

- Login real, JWT persistente, refresh automatico y logout revocable.
- Navegacion y opciones por rol administrador/auditor.
- Dashboard, usuarios, inventario, edificios y estados desde PostgreSQL.
- Creacion, edicion, inicio, cancelacion, eliminacion y resultados de auditorias.
- Camara con lectura QR y busqueda manual como alternativa.
- Revision fisica validada y evidencia fotografica con integridad SHA-256.
- Historial de auditorias cerradas y manejo visible de errores de red/API.

En web la sesion usa almacenamiento del navegador; Android/iOS usan Expo SecureStore.
