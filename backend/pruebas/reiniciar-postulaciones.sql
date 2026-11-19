-- Deja la base de carga como la semilla: borra las postulaciones que crearon las
-- pruebas k6 (las ofertas de Ingeniería de Sistemas). Las 5 000 sembradas, que son
-- de Derecho, se conservan. Ejecutar entre una prueba de postulación y la siguiente.
DELETE FROM postulaciones.postulaciones
WHERE oferta_id IN (SELECT id FROM ofertas.ofertas WHERE carrera <> 'Derecho');

SELECT count(*) AS postulaciones_restantes FROM postulaciones.postulaciones;
