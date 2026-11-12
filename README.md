# React + Vite

## Acceso de empleados

Configura `VITE_API_URL` con la URL del backend (por defecto,
`http://localhost:8000`). El formulario envía el correo y la contraseña a
`POST /empleados/login`; el backend comprueba la contraseña con bcrypt. Las
cuentas existentes con PBKDF2 siguen siendo compatibles y las contraseñas nuevas
o actualizadas no pueden superar 72 bytes UTF-8. Usa HTTPS fuera del entorno
local; bcrypt no cifra el tráfico ni sustituye HTTPS.

El backend actual no emite tokens ni exige autenticación o autorización para
sus endpoints. Las rutas protegidas del frontend solo controlan la navegación y
no impiden el acceso directo a la API; no utilices esta configuración como
control de acceso en producción.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
