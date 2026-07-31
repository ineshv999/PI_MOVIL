# SGAFAQ Movil

Aplicacion Expo SDK 54 conectada a la API propia SGA. Conserva las interfaces del proyecto y utiliza datos reales de PostgreSQL.

## Web

```cmd
npm install
npm run web
```

Abre la direccion que muestre Expo. La aplicacion utiliza la API publica `https://api.qractivos.xyz/api/v1`.

## Telefono con Expo Go

La API funciona desde cualquier red con acceso a Internet. Copia `.env.example` como `.env`:

```env
EXPO_PUBLIC_API_URL=https://api.qractivos.xyz/api/v1
```

Reinicia Metro con `npx expo start --clear`, abre Expo Go y escanea el QR de Expo.

## Funciones conectadas

- Login real, JWT persistente, refresh automatico y logout revocable.
- Navegacion y opciones por rol administrador/auditor.
- Dashboard, usuarios, inventario, edificios y estados desde PostgreSQL.
- Creacion, edicion, inicio, cancelacion, eliminacion y resultados de auditorias.
- Camara con lectura QR y busqueda manual como alternativa.
- Revision fisica validada y evidencia fotografica con integridad SHA-256.
- Historial de auditorias cerradas y manejo visible de errores de red/API.

En web la sesion usa almacenamiento del navegador; Android/iOS usan Expo SecureStore.
