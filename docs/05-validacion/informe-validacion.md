# Evidencias y resultados de validación de atributos de calidad

Sprint 2, actividad 8. Este documento registra solo lo que se ejecutó, con la salida real de cada prueba. Los criterios de aceptación son los del [protocolo del Sprint 1](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md).

## Resumen

| Escenario | Atributo | Herramienta | Objetivo | Resultado | Veredicto |
|---|---|---|---|---|---|
| EQ-01 búsqueda, 20 usuarios | AC01 Rendimiento | k6 | p95 ≤ 2 s, fallos < 1 %, 0 ofertas incorrectas | p95 4,31 ms, 0 % fallos, 0 incorrectas | **Cumple** |
| EQ-01 búsqueda, 25 usuarios | AC01 Rendimiento | k6 | ídem | p95 4,43 ms, 0 % fallos, 0 incorrectas | **Cumple** |
| EQ-02 postulación, 20 usuarios | AC01 Rendimiento | k6 | p95 ≤ 3 s, fallos < 1 % | p95 73,4 ms, 0 % fallos | **Cumple** |
| EQ-02 postulación, 25 usuarios | AC01 Rendimiento | k6 | ídem | p95 74,3 ms, 0 % fallos | **Cumple** |
| EQ-02 ráfaga de 25 solicitudes | AC01 / RF05 | k6 + SQL | 1×201, 24×409, 0×5xx, 1 fila | 1×201, 24×409, 0×5xx, 1 fila | **Cumple** |
| Estrés hasta 2 000 usuarios | AC01 Rendimiento | k6 | Sin umbral: identificar el punto de degradación | No se degradó (p95 720 ms, 0 % fallos) | **Informativo** |
| EQ-03 seguridad | AC02 Seguridad | `matriz-seguridad.cjs` | 50/50 denegados, 25/25 autorizados, 0 datos expuestos, 0 escrituras indebidas | 50/50, 25/25, 0, 0 | **Cumple** |
| EQ-04 cambio localizado | AC03 Mantenibilidad | Revisión de diff y pruebas | 0 archivos fuera del adaptador, pruebas en verde | 0 archivos, 100/100 | **Cumple** |
| Pruebas automáticas y cobertura | AC03 | Jest + GitHub Actions | Pruebas en verde en cada push | 100 pruebas, 12 suites, CI en verde | **Cumple** (cobertura 75,2 %) |

## Entorno

| Dato | Valor |
|---|---|
| Fecha | 18 de noviembre de 2026 |
| Código evaluado | Rama `feature/sprint2-evidencias`. Backend desde `8b308f4`; los commits posteriores solo tocan scripts de prueba y README |
| Equipo | **Pendiente de registrar** (procesador y RAM del equipo donde corrieron las pruebas) |
| Versiones | k6 2.4.0 (Windows), Node.js 26.13.0; PostgreSQL local (versión pendiente de registrar) |
| Semilla | 100 empresas, 1 000 ofertas (800 de Ingeniería de Sistemas, 200 de Derecho), 2 000 estudiantes con créditos verificados, 5 000 postulaciones previas (`semilla-carga.sql`) |
| Configuración | Backend, PostgreSQL y k6 en la misma máquina; pool de conexiones de `pg` por defecto (10); tiempo de espera de 2 s entre iteraciones de cada usuario virtual |
| Protocolo | 1 min de subida, 2 min de calentamiento y 10 min de medición estable. Los umbrales cuentan solo la fase de medición |

**Importante sobre el alcance.** Todo se midió con el servidor y la base en el mismo equipo local, sin la red de Render ni de Neon. Los tiempos de respuesta son por eso mucho menores de lo que verá un usuario en producción: una consulta a Neon desde el equipo del autor añade cerca de 120 ms de red, algo que se observó en una medición descartada. Las pruebas demuestran que la aplicación y su consulta son eficientes y que los controles funcionan, pero no son una promesa de latencia para el despliegue en la nube. Medir en producción queda como trabajo futuro.

## EQ-01 — Búsqueda de ofertas

Cada usuario virtual busca ofertas de su carrera con filtros y paginación (20 por página), 10 minutos de medición.

| | 20 usuarios | 25 usuarios |
|---|---|---|
| Peticiones en la medición | 6 000 | 7 500 |
| p50 (mediana) | 2,72 ms | 2,72 ms |
| p90 | 3,88 ms | 3,96 ms |
| **p95** | **4,31 ms** | **4,43 ms** |
| Máximo | 42,19 ms | 11,72 ms |
| Tasa de error | 0,00 % | 0,00 % |
| Ofertas incorrectas (no publicadas, vencidas o de otra carrera) | 0 | 0 |
| Verificaciones que pasaron | 14 980 de 14 980 | 18 740 de 18 740 |

Objetivo: p95 ≤ 2 s, fallos < 1 %. **Cumple** con un margen de cientos de veces.

## EQ-02 — Postulación

Cada usuario virtual, con su propio estudiante, postula a una oferta compatible distinta en cada iteración. Solo cuenta el 201 como éxito.

| | 20 usuarios | 25 usuarios |
|---|---|---|
| Peticiones en la medición | 5 855 | 7 325 |
| p50 (mediana) | 51,8 ms | 49,3 ms |
| p90 | 67,8 ms | 67,9 ms |
| **p95** | **73,4 ms** | **74,3 ms** |
| Máximo | 2,42 s (un solo caso) | 171,5 ms |
| Tasa de error | 0,00 % | 0,00 % |
| Verificaciones que pasaron | 7 345 de 7 345 | 9 164 de 9 164 |

Objetivo: p95 ≤ 3 s, fallos < 1 %. **Cumple.** En la prueba de 20 usuarios apareció una sola petición lenta de 2,42 s entre 7 365 y no se repitió en la de 25 usuarios. No afecta al p95 y se atribuye a una pausa del equipo (recolección de basura o del sistema operativo) y no al servidor, aunque no se investigó más.

### Ráfaga de 25 solicitudes simultáneas de la misma cuenta

Se envían 25 solicitudes a la vez, desde la misma cuenta y a la misma oferta, para comprobar que la restricción única `(oferta_id, estudiante_id)` y la inserción `ON CONFLICT DO NOTHING` aguantan la concurrencia.

| Medida | Esperado | Obtenido |
|---|---|---|
| Respuestas 201 (creada) | 1 | 1 |
| Respuestas 409 (duplicada) | 24 | 24 |
| Respuestas 5xx | 0 | 0 |
| Filas en `postulaciones.postulaciones` para esa pareja | 1 | 1 |

**Cumple.** Se ejecutó el 18-nov a las 12:07 y se repitió a las 19:40, con el mismo resultado. En la repetición el recuento SQL se hizo sobre otro estudiante por un error de la lista de ids de la prueba (ver «Hallazgos del proceso»); el recuento posterior a las 20:17 con el estudiante correcto dio una sola fila.

## Estrés — rampa hasta 2 000 usuarios

No es el escenario de aceptación (que son 20 y 25 usuarios): sirve para ver cómo se comporta el sistema por encima de la carga prevista. Rampa de 1 minuto hasta el 10 %, 25 %, 50 %, 75 % y 100 % de 2 000 usuarios, 2 minutos en el pico y 1 minuto de bajada (unos 8 minutos).

| Medida | Resultado |
|---|---|
| Usuarios virtuales en el pico | 2 000 |
| Peticiones totales | 244 374 |
| Rendimiento medio | 507 peticiones por segundo |
| p50 | 26,1 ms |
| p90 | 667 ms |
| p95 | 720 ms |
| Máximo | 1,04 s |
| Tasa de error | 0,00 % (0 de 244 374) |
| Verificaciones que pasaron | 244 374 de 244 374 |

**Resultado.** En ningún momento el p95 superó los 2 s ni apareció un error: **no se alcanzó el punto de degradación** con esta configuración. La mediana sube de unos 3 ms (con 20 usuarios) a 26 ms y el p95 a 720 ms: el sistema se ralentiza de forma gradual, no se rompe.

**Límites de esta evidencia.** El generador de carga, el servidor y la base compartieron el mismo equipo, y compiten por CPU. Es probable que parte de la latencia medida sea del propio generador y que el sistema aguante más en equipos separados, pero eso no se probó. Tampoco se registró el p95 de cada escalón de la rampa, solo el resumen de la prueba entera, así que no se puede indicar con qué número de usuarios empieza a crecer la latencia.

## EQ-03 — Matriz de seguridad

Se ejecutó `matriz-seguridad.cjs` contra el backend local: crea cuentas propias de empresa, estudiante y coordinador, ejecuta 25 operaciones autorizadas que dejan el sistema en distintos estados, y luego 50 accesos que deben denegarse. Compara una foto del estado antes y después de los accesos denegados.

| Medida | Resultado |
|---|---|
| Accesos no autorizados rechazados | **50 de 50** |
| Controles autorizados exitosos | **25 de 25** |
| Datos protegidos expuestos en respuestas denegadas | **0** |
| Escrituras indebidas (cambios entre la foto previa y la posterior) | **0** |
| Veredicto del script | `cumple: true` |

La matriz cubre: sin sesión (14 casos), token inventado, alterado o con rol modificado (4), estudiante en rutas de otros roles (11), empresa en rutas de otros roles (11), propiedad de recursos ajenos (6) y escalada de privilegios o datos inválidos (4). La tabla completa, caso por caso, la genera el script en `backend/pruebas/k6/resultados/eq03-matriz.md`.

Durante la preparación de esta prueba, la matriz detectó un defecto real: `PUT /auth/perfil-academico` devolvía 400 (validación) y no 403 a una cuenta de empresa, porque se validaba el cuerpo antes de comprobar el rol. No exponía datos, pero se corrigió para que se autorice antes de validar. El cambio quedó en el commit `8b308f4`.

## EQ-04 — Cambio localizado en el adaptador de Postulaciones

**Fecha:** 18-nov-2026. **Commit base:** `bf80dd9`.

**Cambio realizado.** Se modificó una consulta SQL del adaptador PostgreSQL de Postulaciones (`contarPorEstado` en `postulaciones.repository.cjs`: se añadió `ORDER BY estado`), conservando el contrato del repositorio y el contrato REST. El cambio se descartó después, solo se hizo para la prueba.

| Medida del escenario | Resultado |
|---|---|
| Archivos de producción modificados fuera de la infraestructura de Postulaciones | **0** (`git diff --stat`: 1 archivo, 1 inserción, 1 eliminación) |
| Pruebas previamente aprobadas que siguen pasando | **100 de 100** antes y después del cambio |
| La consulta modificada funciona en PostgreSQL | Sí: devuelve los mismos grupos por estado, ahora ordenados |

**Alcance de la evidencia.** Las pruebas automáticas usan un repositorio en memoria, así que comprueban que el dominio, los casos de uso y los controladores no dependen de la consulta. La consulta nueva se verificó aparte contra PostgreSQL.

## Pruebas automáticas, cobertura e integración continua

Pruebas con Jest (`npm run test:cobertura`): **100 pruebas en 12 suites, todas en verde.**

| Métrica | Cobertura |
|---|---|
| Sentencias | 75,18 % |
| Ramas | 80,50 % |
| Funciones | 71,42 % |
| Líneas | 75,16 % |

La integración continua (GitHub Actions, `.github/workflows/ci.yml`) ejecuta en cada push dos trabajos: «Backend (Jest)», que sube el informe de cobertura como artefacto `cobertura-backend`, y «Frontend (compilación)». La ejecución n.º 5 de la rama terminó con ambos trabajos en verde.

**Dónde está y dónde no está la cobertura.** La lógica de negocio (casos de uso, reglas y manejadores) concentra la mayor parte de la cobertura. Los repositorios (consultas SQL) y los routers de Express quedan entre el 0 % y el 42 %, porque las pruebas automáticas usan repositorios en memoria. Esa parte la ejercitan las pruebas de carga con k6 y la matriz de seguridad contra una base real, que sí pasan por esas rutas y consultas, pero no se miden en el porcentaje. Como mejora queda escribir pruebas de integración de los repositorios contra PostgreSQL.

## Hallazgos del proceso

Registrados porque explican resultados descartados y deben tenerse en cuenta al reproducir las pruebas.

1. **Medición descartada contra la base equivocada.** Una primera ejecución de EQ-01 (p95 327 ms) se hizo con el backend conectado a otra base y no se usa. El p95 era alto por la latencia de red de la base en la nube (~120 ms por consulta), que no representa el escenario local. Antes de cada tanda hay que comprobar que `DATABASE_URL` apunta a `practicas_carga` (debe mostrar 1 000 ofertas o más).
2. **Datos de prueba mal cargados.** La semilla se cargó con la codificación de la consola de Windows y las tildes quedaron dañadas («Ingeniería» como dos caracteres extra). Los filtros por carrera devolvían 0 resultados y una prueba de carga habría medido búsquedas vacías. Se reparó con `corregir-codificacion.sql`, y `semilla-carga.sql` ahora fuerza UTF-8.
3. **Corrida descartada de EQ-02 con 20 usuarios.** Una ejecución de 13 minutos dio 18 % de respuestas distintas de 201 por empezar sin restablecer las postulaciones de una prueba anterior. Se repitió con la base reiniciada (el script `Reiniciar` ahora muestra el recuento y debe dar 5 000) y los resultados válidos son los de este documento.
4. **Tokens caducados.** Los tokens de sesión duran 8 horas; una ráfaga lanzada con tokens más viejos recibió 401. Es el comportamiento esperado y confirma la expiración. Se regeneran con `generar-tokens.cjs` justo antes de cada tanda.
5. **Lista de ids.** Tras la matriz de seguridad, la lista de estudiantes incluyó cuatro cuentas que no eran de la semilla y la ráfaga usó una de ellas. La consulta de ids se limita ahora a los correos `@carga.test` (README actualizado).

## Cómo reproducir

1. Seguir [`backend/pruebas/README.md`](../../backend/pruebas/README.md): base de carga con la semilla, tokens y backend contra esa base.
2. Ejecutar cada prueba con la base reiniciada (`reiniciar-postulaciones.sql`) y tokens recientes.
3. Para EQ-03, un coordinador en la base de carga y `node pruebas\seguridad\matriz-seguridad.cjs`.
4. Los resultados quedan en `backend/pruebas/k6/resultados/` (`.json` de `--summary-export`, `.txt` de la consola, `eq03-matriz.md`).
