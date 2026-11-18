-- Semilla ficticia para las pruebas de carga (protocolo del Sprint 1):
-- 100 empresas, 1 000 ofertas publicadas, 2 000 estudiantes con créditos verificados
-- y 5 000 postulaciones. Usar SOLO en una base vacía y exclusiva para pruebas
-- (por ejemplo practicas_carga) con las migraciones ya aplicadas.
-- Las ofertas con id múltiplo de 5 son de Derecho: las postulaciones sembradas van
-- solo a esas, para no chocar con las que hacen los scripts de k6.
\set ON_ERROR_STOP on

DO $$
BEGIN
  IF (SELECT count(*) FROM identidad.usuarios) > 0 THEN
    RAISE EXCEPTION 'La base no está vacía: usa una base nueva para las pruebas de carga';
  END IF;
END $$;

BEGIN;

-- Empresas: usuario + empresa aprobada vinculada.
INSERT INTO identidad.usuarios (correo, hash_clave, rol, nombre, ruc, razon_social)
SELECT 'empresa' || i || '@carga.test', 'sin-clave', 'empresa', 'Empresa ' || i,
       lpad((20000000000 + i)::text, 11, '0'), 'Empresa de prueba ' || i || ' S.A.C.'
FROM generate_series(1, 100) AS i;

INSERT INTO ofertas.empresas (ruc, razon_social, estado, propietario_usuario_id)
SELECT ruc, razon_social, 'aprobada', id
FROM identidad.usuarios WHERE rol = 'empresa';

-- Ofertas publicadas: 80 % Ingeniería de Sistemas y 20 % Derecho (id múltiplo de 5).
INSERT INTO ofertas.ofertas
  (empresa_id, titulo, descripcion, carrera, ciclo_minimo, creditos_minimos,
   modalidad, vacantes, fecha_limite, estado)
SELECT ((i - 1) % 100) + 1,
       'Práctica ' || i,
       'Oferta de prueba número ' || i,
       CASE WHEN i % 5 = 0 THEN 'Derecho' ELSE 'Ingeniería de Sistemas' END,
       (i % 8) + 1,
       160,
       (ARRAY['presencial', 'remota', 'hibrida'])[(i % 3) + 1],
       100000,
       CURRENT_DATE + 90,
       'publicada'
FROM generate_series(1, 1000) AS i;

-- Estudiantes con créditos ya verificados.
INSERT INTO identidad.usuarios
  (correo, hash_clave, rol, nombre, codigo_estudiante, carrera, ciclo,
   creditos_aprobados, creditos_verificados_en)
SELECT 'est' || i || '@carga.test', 'sin-clave', 'estudiante', 'Estudiante ' || i,
       lpad((10000000 + i)::text, 8, '0'), 'Ingeniería de Sistemas', 8, 200, now()
FROM generate_series(1, 2000) AS i;

-- 5 000 postulaciones previas: 1 000 estudiantes x 5 ofertas de Derecho distintas.
WITH derecho AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS pos
  FROM ofertas.ofertas WHERE carrera = 'Derecho'
), estudiantes AS (
  SELECT id, row_number() OVER (ORDER BY id) AS n
  FROM identidad.usuarios WHERE rol = 'estudiante'
)
INSERT INTO postulaciones.postulaciones (oferta_id, estudiante_id, estado)
SELECT d.id, e.id, 'pendiente'
FROM estudiantes e
JOIN generate_series(0, 4) AS k ON true
JOIN derecho d ON d.pos = (e.n + k * 37) % 200
WHERE e.n <= 1000;

COMMIT;

ANALYZE;

SELECT (SELECT count(*) FROM ofertas.empresas)            AS empresas,
       (SELECT count(*) FROM ofertas.ofertas)             AS ofertas,
       (SELECT count(*) FROM identidad.usuarios
         WHERE rol = 'estudiante')                        AS estudiantes,
       (SELECT count(*) FROM postulaciones.postulaciones) AS postulaciones;
