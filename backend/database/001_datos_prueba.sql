BEGIN;

-- Empresa ficticia para demostración.
INSERT INTO ofertas.empresas (
    ruc,
    razon_social,
    estado
)
VALUES (
    '00000000001',
    'Empresa Demo UNSCH',
    'aprobada'
)
ON CONFLICT (ruc) DO NOTHING;

-- Oferta ficticia asociada a esa empresa.
INSERT INTO ofertas.ofertas (
    empresa_id,
    titulo,
    descripcion,
    carrera,
    ciclo_minimo,
    creditos_minimos,
    modalidad,
    vacantes,
    fecha_limite,
    estado
)
SELECT
    e.id,
    'Practicante de desarrollo web',
    'Apoyo en desarrollo de aplicaciones web con React y Node.js.',
    'Ingeniería de Sistemas',
    8,
    0,
    'hibrida',
    2,
    CURRENT_DATE + 30,
    'publicada'
FROM ofertas.empresas AS e
WHERE e.ruc = '00000000001'
  AND NOT EXISTS (
      SELECT 1
      FROM ofertas.ofertas AS o
      WHERE o.empresa_id = e.id
        AND o.titulo = 'Practicante de desarrollo web'
  );

COMMIT;