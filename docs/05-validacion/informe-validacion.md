# Evidencias y resultados de validación de atributos de calidad

Sprint 2, actividad 8. Este documento registra solo lo que se ejecutó. Los resultados marcados como **pendiente** se completan con la salida real de cada prueba; no se declara cumplido un objetivo sin evidencia, como pide el [protocolo del Sprint 1](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md).

## Estado

| Escenario | Atributo | Herramienta | Estado |
|---|---|---|---|
| EQ-01 búsqueda, 20 y 25 usuarios | AC01 Rendimiento | k6 (`eq01-busqueda.js`) | **Pendiente de ejecución** |
| EQ-02 postulación, 20 y 25 usuarios | AC01 Rendimiento | k6 (`eq02-postulacion.js`) | **Pendiente de ejecución** |
| EQ-02 ráfaga de 25 solicitudes | AC01 / RF05 | k6 (`eq02-rafaga.js`) | **Pendiente de ejecución** |
| Estrés hasta 2 000 usuarios | AC01 Rendimiento | k6 (`estres-2000.js`) | **Pendiente de ejecución** |
| EQ-03 seguridad, 50 denegados y 25 autorizados | AC02 Seguridad | `matriz-seguridad.cjs` | **Pendiente de ejecución** |
| EQ-04 cambio localizado | AC03 Mantenibilidad | Revisión de diff y pruebas | **Cumplido** (abajo) |
| Pruebas automáticas y cobertura | AC03 | Jest | **Pendiente** de reporte de cobertura |

## Entorno (completar al ejecutar)

| Dato | Valor |
|---|---|
| Fecha | |
| Commit | |
| Equipo (procesador y RAM) | |
| Versiones: k6, Node, PostgreSQL | |
| Semilla | 100 empresas, 1 000 ofertas, 2 000 estudiantes, 5 000 postulaciones (`semilla-carga.sql`) |
| Configuración | Backend y PostgreSQL en la misma máquina que k6; pool de conexiones de `pg` por defecto (10) |

## EQ-04 — Cambio localizado en el adaptador de Postulaciones (ejecutado)

**Fecha:** 18-nov-2026. **Commit base:** `bf80dd9`.

**Cambio realizado.** Se modificó una consulta SQL del adaptador PostgreSQL de Postulaciones (`contarPorEstado` en `postulaciones.repository.cjs`: se añadió `ORDER BY estado`), conservando el contrato del repositorio y el contrato REST. El cambio se descartó después, solo se hizo para la prueba.

| Medida del escenario | Resultado |
|---|---|
| Archivos de producción modificados fuera de la infraestructura de Postulaciones | **0** (`git diff --stat`: 1 archivo, 1 inserción, 1 eliminación) |
| Pruebas previamente aprobadas que siguen pasando | **100 de 100** antes y después del cambio |
| La consulta modificada funciona en PostgreSQL | Sí: devuelve los mismos grupos por estado, ahora ordenados |

**Alcance de la evidencia.** Las pruebas automáticas usan un repositorio en memoria, así que comprueban que el dominio, los casos de uso y los controladores no dependen de la consulta. La consulta nueva se verificó aparte contra PostgreSQL. Las pruebas del adaptador contra una base real quedan pendientes.

## Cómo completar el resto

1. Seguir [`backend/pruebas/README.md`](../../backend/pruebas/README.md).
2. Pegar aquí, por escenario: fecha, solicitudes totales, p50, p95, máximo, solicitudes por segundo, tasa de error y veredicto frente al objetivo (tomados de `--summary-export` o del resumen de k6).
3. Para EQ-03, adjuntar `eq03-matriz.md` generado por el script.
4. Para el estrés, describir el punto en que el p95 supera 2 s o aparecen errores, y la causa probable.
5. Para la cobertura, pegar la tabla de `npm run test:cobertura`.
