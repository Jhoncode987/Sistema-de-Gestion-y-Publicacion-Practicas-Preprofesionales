# Portal web de prácticas preprofesionales (UNSCH)

Interfaz en React 19 con Vite. Por ahora muestra el listado de ofertas de prácticas que devuelve el backend.

## Ejecución

```
npm install
npm run dev      # http://localhost:5173
npm run build    # genera la carpeta dist
npm run lint
```

El backend debe estar en `http://localhost:3000`. En desarrollo, Vite redirige las peticiones de `/api` hacia el backend (ver `vite.config.js`).

Para desplegar el frontend por separado, define la variable `VITE_API_URL` con la dirección del backend (ver `.env.example`) y, en el backend, `CORS_ORIGIN` con la dirección del frontend.

## Estructura

- `src/App.jsx`: página principal, carga las ofertas desde `/api/v1/ofertas`.
- `src/App.css` e `src/index.css`: estilos. Los colores están definidos como variables al inicio de `App.css`.
- `public/logo-unsch.png`: logo institucional.
