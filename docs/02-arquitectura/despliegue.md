# Despliegue

El sistema está publicado con tres servicios gratuitos, uno por capa:

| Capa | Servicio | Región | Qué contiene |
|------|----------|--------|--------------|
| Interfaz web | Vercel | Global (CDN) | React + Vite, carpeta `frontend` |
| API | Render (Web Service, plan gratuito) | Virginia (US East) | Node.js + Express, carpeta `backend` |
| Base de datos | Neon (PostgreSQL 18) | US East 1 (Virginia) | Esquemas `identidad`, `ofertas` y `postulaciones` |

Cada push a la rama `main` vuelve a desplegar Vercel y Render automáticamente.

## Variables de entorno

**Render (backend)**

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Cadena de conexión de Neon (`postgresql://...?sslmode=require`). Si no se define, se usan `PGHOST`, `PGUSER`, etc. |
| `JWT_SECRET` | Clave aleatoria de 32 caracteres o más para firmar las sesiones. |
| `CORS_ORIGIN` | Dirección exacta del frontend, con `https://` y sin barra final. |

**Vercel (frontend)**

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | Dirección del backend en Render, sin barra final. Se incorpora al compilar: tras cambiarla hay que volver a desplegar. |

## Primera puesta en marcha

1. **Neon:** crear el proyecto (PostgreSQL 18, región US East 1) y copiar la cadena de conexión.
2. **Migraciones:** ejecutar en orden `backend/migrations/001` a `009` con `psql <cadena> -f <archivo>`.
3. **Coordinador:** `DATABASE_URL=<cadena> COORDINADOR_CLAVE=<clave> node backend/scripts/crear-coordinador.cjs <correo> "<nombre>"`.
4. **Render:** Web Service sobre el repositorio, `Root Directory = backend`, build `npm install`, start `npm start`, con las variables anteriores.
5. **Vercel:** importar el repositorio como proyecto único con `Root Directory = frontend` y la variable `VITE_API_URL`.
6. **Render:** agregar `CORS_ORIGIN` con la dirección que asignó Vercel.

## Datos de demostración

`backend/database/002_datos_prueba_ofertas.sql` carga ofertas ficticias y `backend/database/003_limpiar_datos_demo.sql` las elimina sin tocar datos reales.

## Limitaciones del plan gratuito

- Render duerme el servicio tras unos 15 minutos sin visitas; la primera petición posterior puede tardar cerca de un minuto.
- Neon pausa el cómputo cuando no hay uso y se reactiva solo en segundos, sin perder datos.

## Cambios de base de datos

Las migraciones nuevas no se aplican solas: deben ejecutarse contra Neon antes de que se despliegue el código que las necesita.

## Dominio propio

En Vercel: Settings → Domains → Add Domain, y crear en el DNS el registro que Vercel indica (CNAME para un subdominio, A para el dominio raíz). Después hay que actualizar `CORS_ORIGIN` en Render con la dirección nueva. El backend no necesita dominio propio.
