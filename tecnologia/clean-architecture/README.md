# Ejemplo tecnológico de Clean Architecture

Esta carpeta explica cómo se aplica Clean Architecture en el código real del backend (Node.js con Express, ADR-006). El módulo que ya tiene código es **Ofertas**, con el caso de uso *Listar ofertas*.

## Dónde está cada capa

| Capa | Archivo | Qué hace |
|---|---|---|
| Presentación | `backend/src/modules/ofertas/presentacion/ofertas.routes.cjs` | Router de Express para `GET /api/v1/ofertas`. Llama al caso de uso y traduce el resultado a una respuesta HTTP. |
| Aplicación | `backend/src/modules/ofertas/aplicacion/listar-ofertas.cjs` y `listar-filtros.cjs` | Casos de uso `listarOfertas` y `listarFiltros`. Validan y normalizan los parámetros (filtros y paginación), reciben el repositorio como parámetro y no conocen Express ni PostgreSQL. |
| Infraestructura | `backend/src/modules/ofertas/infraestructura/ofertas.repository.cjs` | Consulta SQL a `ofertas.ofertas` y `ofertas.empresas` con el cliente `pg`. |
| Composición | `backend/server.cjs` | Crea el pool de PostgreSQL y conecta repositorio, caso de uso y router. |
| Dominio | *Pendiente* | Aún no existe. |

## Flujo de una petición

1. El portal React pide `GET /api/v1/ofertas`.
2. El router llama a `listarOfertas()`.
3. El caso de uso pide al repositorio las ofertas publicadas.
4. El repositorio consulta PostgreSQL y devuelve las filas.
5. El router responde en JSON con `items`, `page`, `pageSize` y `total`, o con `codigo` y `mensaje` si hay un error (400 por parámetros inválidos, 503 si falla la base de datos).

Como el caso de uso recibe el repositorio como parámetro, se puede probar con un repositorio falso, sin base de datos.

## Pendientes

- Crear la capa de dominio. Hoy las reglas "oferta publicada, empresa aprobada y fecha vigente" están en la consulta SQL y deberían pasar a entidades y reglas del dominio.
- Ampliar las pruebas automáticas. Ya existen pruebas del caso de uso con un repositorio simulado y del armado de la consulta SQL (`npm test` en `backend`); faltan las de las rutas HTTP y las de integración con PostgreSQL.
- Replicar esta estructura en los demás módulos (Usuarios y Autenticación, Postulaciones, Convenios, Notificaciones, Integración Académica, Reportes y Auditoría).
