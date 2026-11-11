# Portal web de prácticas preprofesionales (UNSCH)

Interfaz en React 19 con Vite. Por ahora muestra el listado de ofertas de prácticas que devuelve el backend.

## Ejecución

```
npm install
npm run dev      # http://localhost:5173
npm run build    # genera la carpeta dist
npm run lint
```

El backend debe estar en `http://localhost:3000`. En desarrollo, Vite redirige las peticiones de `/api` hacia el backend (ver `vite.config.js`). Para desplegar el frontend por separado habrá que definir la URL de la API, porque ese proxy solo existe en desarrollo.

## Estructura

- `src/App.jsx`: página principal, carga las ofertas desde `/api/v1/ofertas`.
- `src/App.css` e `src/index.css`: estilos. Los colores están definidos como variables al inicio de `App.css`.
- `public/logo-unsch.png`: logo institucional.
