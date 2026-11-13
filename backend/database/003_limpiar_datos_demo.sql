SET client_encoding TO 'UTF8';

-- Elimina SOLO los datos de demostración: las empresas ficticias con RUC
-- 00000000001 a 00000000009 (los RUC reales empiezan con 10, 15, 17 o 20),
-- sus ofertas y las postulaciones hechas a esas ofertas.
-- No toca cuentas de usuario ni ofertas de empresas reales.
-- Es una excepción de limpieza: en el uso normal las ofertas nunca se borran.
BEGIN;

DO $$
DECLARE
    n_postulaciones BIGINT;
    n_ofertas       BIGINT;
    n_empresas      BIGINT;
BEGIN
    DELETE FROM postulaciones.postulaciones
     WHERE oferta_id IN (
        SELECT o.id FROM ofertas.ofertas AS o
          JOIN ofertas.empresas AS e ON e.id = o.empresa_id
         WHERE e.ruc BETWEEN '00000000001' AND '00000000009');
    GET DIAGNOSTICS n_postulaciones = ROW_COUNT;

    DELETE FROM ofertas.ofertas
     WHERE empresa_id IN (
        SELECT id FROM ofertas.empresas
         WHERE ruc BETWEEN '00000000001' AND '00000000009');
    GET DIAGNOSTICS n_ofertas = ROW_COUNT;

    DELETE FROM ofertas.empresas
     WHERE ruc BETWEEN '00000000001' AND '00000000009';
    GET DIAGNOSTICS n_empresas = ROW_COUNT;

    RAISE NOTICE 'Eliminadas: % empresas demo, % ofertas demo, % postulaciones a ofertas demo',
        n_empresas, n_ofertas, n_postulaciones;
END $$;

COMMIT;
