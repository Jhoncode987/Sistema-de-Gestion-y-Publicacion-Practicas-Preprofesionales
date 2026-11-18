# Análisis de la base de datos y estrategia de caché

Sprint 2, actividad 5. Responde dos preguntas: ¿cómo se comporta PostgreSQL con las consultas reales del sistema? y ¿hace falta una caché?

## Método

- Las consultas son las que ejecutan los repositorios de Ofertas y Postulaciones (`backend/src/modules/*/infraestructura`).
- Se analizan con `EXPLAIN (ANALYZE, BUFFERS)` mediante `backend/pruebas/analisis-bd.sql`, sobre la semilla del protocolo de carga: 100 empresas, 1 000 ofertas, 2 000 estudiantes y 5 000 postulaciones.
- Para ver cómo escala, se repitió la consulta de búsqueda con 100 000 ofertas (100 veces más), probando también dos índices candidatos.
- **Las cifras de abajo se midieron con PostgreSQL 16 en un entorno de desarrollo, no en el equipo donde se ejecutan las pruebas k6.** Sirven para comparar planes y órdenes de magnitud. Los números finales del informe deben repetirse con `analisis-bd.sql` en la máquina de pruebas.

## Índices existentes

| Tabla | Índice | Para qué |
|---|---|---|
| `ofertas.ofertas` | `(estado, fecha_limite)` | Ofertas publicadas y vigentes |
| `ofertas.ofertas` | `(empresa_id)` | Ofertas de una empresa |
| `postulaciones.postulaciones` | `UNIQUE (oferta_id, estudiante_id)` | Regla RF05 (sin duplicados) y postulantes de una oferta |
| `postulaciones.postulaciones` | `(estudiante_id)` | Mis postulaciones y "¿ya tiene una práctica aceptada?" |
| `postulaciones.postulaciones` | `(oferta_id, estado)` | Conteo de vacantes ocupadas |

## Resultados con la semilla (1 000 ofertas, 5 000 postulaciones)

| Consulta | Plan | Tiempo de ejecución |
|---|---|---|
| Búsqueda de ofertas, página 5 | Lectura secuencial de 1 000 filas más ordenamiento parcial | 0,5 ms |
| Conteo de la misma búsqueda | Lectura secuencial | 0,3 ms |
| Búsqueda por texto (`ILIKE`) | Lectura secuencial (un índice normal no ayuda con `%texto%`) | 1,5 ms |
| ¿Ya tiene práctica aceptada? | Índice por estudiante | 0,09 ms |
| Insertar postulación | Comprobación en el índice único | 0,2 ms |
| Mis postulaciones | Índice por estudiante | 0,03 ms |
| Postulantes de una oferta | Índice por oferta | menos de 0,1 ms |

Con tablas tan pequeñas PostgreSQL prefiere leerlas completas: es más barato que usar un índice. Todas las consultas están muy por debajo de los objetivos de p95 (2 s y 3 s), de modo que el tiempo de respuesta HTTP bajo carga dependerá del servidor Node y de las conexiones, no de la base.

## Escalado: 100 000 ofertas

| Consulta | Con los índices actuales | Con índices parciales candidatos |
|---|---|---|
| Página de resultados (`ORDER BY id DESC LIMIT 20`) | **0,18 ms**: recorre la clave primaria hacia atrás y se detiene al juntar los resultados | 21 ms (empeora: elige leer por el índice de filtro y luego ordenar) |
| Conteo del filtro | 16 ms (lectura secuencial paralela) | 9,6 ms |

Conclusiones:

1. La página de resultados escala bien sin cambios: el orden por `id` descendente aprovecha la clave primaria y termina pronto.
2. El conteo total (para la paginación) es la consulta que crece con los datos, de forma lineal. A 100 000 ofertas cuesta 16 ms, aún bajo cualquier objetivo.
3. Los índices parciales probados **no se adoptan**: mejoran el conteo en 7 ms pero empeoran la consulta principal de 0,18 ms a 21 ms, y añaden costo de escritura.

## Postulaciones y concurrencia

- La unicidad estudiante–oferta la garantiza el índice único, no el código: ante una ráfaga de solicitudes idénticas solo una inserción tiene éxito. La prueba de ráfaga (`eq02-rafaga.js`) lo comprueba.
- Aceptar a un postulante usa bloqueos consultivos de transacción (`pg_advisory_xact_lock`) por oferta y por estudiante. Serializan únicamente las decisiones sobre la misma oferta o el mismo estudiante; no afectan a la búsqueda ni al envío de postulaciones.
- La transacción es corta (unas pocas consultas con índice), así que el bloqueo se mantiene milisegundos.

## Estrategia de caché

**Decisión: no usar caché por ahora**, coherente con RC05 y ADR-006 (PostgreSQL como única base, sin caché externa).

Razones:

- Las consultas más frecuentes (búsqueda y postulación) tardan fracciones de milisegundo y dejan margen de 3 órdenes de magnitud frente a los objetivos.
- Los resultados de búsqueda cambian cuando la coordinación publica o cierra ofertas, y un estudiante debe ver vacantes y cierres sin retraso. Una caché obligaría a invalidar con cuidado y añadiría riesgo de mostrar ofertas cerradas.
- Una caché en memoria de un solo proceso complica un posible escalado horizontal (cada instancia tendría su copia).

Qué se mediría antes de añadirla (criterio de reevaluación):

1. Si en la prueba de estrés el p95 de la búsqueda supera 2 s y el perfil muestra que el tiempo está en PostgreSQL (no en Node ni en el pool de conexiones).
2. Si el conteo total pasa de 100 ms con volúmenes reales.

Opciones, en orden de menor a mayor complejidad: (a) aumentar el tamaño del pool de conexiones (hoy el valor por defecto de `pg` es 10); (b) caché en memoria de 30 a 60 segundos solo para `/ofertas/filtros` y el conteo; (c) paginación por cursor para quitar el conteo; (d) caché externa (Redis), solo si hay varias instancias.

## Límites de este análisis

- Datos sintéticos distribuidos de forma uniforme; los reales pueden tener otra selectividad.
- Medido sin carga concurrente; el comportamiento bajo carga lo evalúan las pruebas k6 (EQ-01, EQ-02 y estrés).
- Pendiente: repetir `analisis-bd.sql` en el equipo de pruebas y anotar aquí sus tiempos.
