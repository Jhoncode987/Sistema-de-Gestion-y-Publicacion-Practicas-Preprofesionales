-- Análisis del comportamiento de la base de datos (Sprint 2, actividad 5).
-- Ejecutar sobre la base de carga (semilla aplicada):
--   psql -U postgres -d practicas_carga -f backend/pruebas/analisis-bd.sql
-- Cada consulta es la que ejecuta el backend (repositorios de Ofertas y Postulaciones).
\pset pager off
\echo '== Tamaño de las tablas y uso de índices =='
SELECT relname AS tabla, n_live_tup AS filas FROM pg_stat_user_tables
 WHERE schemaname IN ('identidad','ofertas','postulaciones') ORDER BY relname;
SELECT schemaname || '.' || indexrelname AS indice, idx_scan AS usos FROM pg_stat_user_indexes
 WHERE schemaname IN ('identidad','ofertas','postulaciones') ORDER BY 1;

\echo '== 1. EQ-01: búsqueda de ofertas (filtro de modalidad y carrera, página 5 de 20) =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT o.id, e.razon_social AS empresa, o.titulo, o.descripcion, o.carrera, o.ciclo_minimo,
       o.creditos_minimos, o.modalidad, o.vacantes, o.fecha_limite, o.estado
FROM ofertas.ofertas o JOIN ofertas.empresas e ON e.id = o.empresa_id
WHERE o.estado = 'publicada' AND e.estado = 'aprobada' AND o.fecha_limite >= CURRENT_DATE
  AND o.modalidad = 'remota' AND LOWER(o.carrera) = LOWER('Ingeniería de Sistemas')
ORDER BY o.id DESC LIMIT 20 OFFSET 80;

\echo '== 2. EQ-01: conteo del mismo filtro =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT COUNT(*)::int FROM ofertas.ofertas o JOIN ofertas.empresas e ON e.id = o.empresa_id
WHERE o.estado = 'publicada' AND e.estado = 'aprobada' AND o.fecha_limite >= CURRENT_DATE
  AND o.modalidad = 'remota' AND LOWER(o.carrera) = LOWER('Ingeniería de Sistemas');

\echo '== 3. EQ-01: búsqueda por texto (ILIKE, no usa índice) =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT o.id FROM ofertas.ofertas o JOIN ofertas.empresas e ON e.id = o.empresa_id
WHERE o.estado = 'publicada' AND e.estado = 'aprobada' AND o.fecha_limite >= CURRENT_DATE
  AND (o.titulo ILIKE '%práctica 77%' OR o.descripcion ILIKE '%práctica 77%' OR e.razon_social ILIKE '%práctica 77%')
ORDER BY o.id DESC LIMIT 20;

\echo '== 4. EQ-02: ¿el estudiante ya tiene una práctica aceptada? =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT 1 FROM postulaciones.postulaciones WHERE estudiante_id = 500 AND estado = 'aceptada' LIMIT 1;

\echo '== 5. EQ-02: inserción de la postulación (restricción única estudiante-oferta) =='
BEGIN;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
INSERT INTO postulaciones.postulaciones (oferta_id, estudiante_id)
SELECT 1, id FROM identidad.usuarios WHERE rol = 'estudiante' ORDER BY id LIMIT 1;
ROLLBACK;

\echo '== 6. Mis postulaciones del estudiante =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id FROM postulaciones.postulaciones WHERE estudiante_id = 500 ORDER BY creada_en DESC, id DESC;

\echo '== 7. Postulantes de una oferta (vista de la empresa) =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id FROM postulaciones.postulaciones WHERE oferta_id = 5
ORDER BY CASE estado WHEN 'pendiente' THEN 0 WHEN 'aceptada' THEN 1 WHEN 'finalizada' THEN 2 ELSE 3 END, creada_en;

\echo '== 8. Vista de coordinación: resumen y listado por estado =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT estado, count(*)::int FROM postulaciones.postulaciones GROUP BY estado;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id FROM postulaciones.postulaciones WHERE ('pendiente'::text IS NULL OR estado = 'pendiente')
ORDER BY creada_en DESC, id DESC LIMIT 20 OFFSET 0;

\echo '== 9. Verificación de créditos: lista de estudiantes pendientes =='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id FROM identidad.usuarios WHERE rol = 'estudiante' AND activo AND creditos_verificados_en IS NULL
ORDER BY nombre, id LIMIT 20 OFFSET 0;
