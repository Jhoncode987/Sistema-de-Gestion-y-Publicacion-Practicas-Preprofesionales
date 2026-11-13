-- Datos de prueba para ver los filtros y la paginación del portal.
-- Todas las empresas son ficticias y llevan el prefijo "Demo".
-- Se puede ejecutar varias veces: reemplaza solo las empresas demo
-- (RUC 00000000002 a 00000000009) y sus ofertas, sin duplicar registros.
-- Requiere haber ejecutado antes 001_crear_empresas_y_ofertas.sql.

-- El archivo está en UTF-8: se fuerza la codificación para que las tildes
-- no se dañen cuando psql corre en Windows (por defecto usa WIN1252).
SET client_encoding TO 'UTF8';

BEGIN;

-- Limpia datos demo previos (también repara filas cargadas con tildes dañadas).
DELETE FROM ofertas.ofertas
WHERE empresa_id IN (
    SELECT id FROM ofertas.empresas
    WHERE ruc BETWEEN '00000000002' AND '00000000009'
);
DELETE FROM ofertas.empresas
WHERE ruc BETWEEN '00000000002' AND '00000000009';

INSERT INTO ofertas.empresas (ruc, razon_social, estado)
VALUES
    ('00000000002', 'Demo Soluciones Andinas S.A.C.',        'aprobada'),
    ('00000000003', 'Demo Constructora Huamanga S.A.C.',     'aprobada'),
    ('00000000004', 'Demo Agroexportadora Ayacucho S.A.C.',  'aprobada'),
    ('00000000005', 'Demo Estudio Contable Asociados',       'aprobada'),
    ('00000000006', 'Demo Clínica Salud Integral',           'aprobada'),
    ('00000000007', 'Demo Consultores Legales',              'aprobada'),
    ('00000000008', 'Demo Empresa Pendiente de Validación',  'pendiente'),
    ('00000000009', 'Demo Empresa Rechazada',                'rechazada')
ON CONFLICT (ruc) DO NOTHING;

WITH nuevas (
    ruc, titulo, descripcion, carrera, ciclo_minimo,
    creditos_minimos, modalidad, vacantes, dias, estado
) AS (
    VALUES
    -- Ingeniería de Sistemas
    ('00000000002', 'Practicante de soporte técnico TI', 'Atención de incidencias, mantenimiento de equipos y soporte a usuarios.', 'Ingeniería de Sistemas', 6, 0, 'presencial', 3, 25, 'publicada'),
    ('00000000002', 'Practicante de análisis de datos', 'Limpieza de datos, tableros en Power BI y reportes mensuales.', 'Ingeniería de Sistemas', 8, 100, 'remota', 2, 40, 'publicada'),
    ('00000000002', 'Practicante de pruebas de software (QA)', 'Diseño y ejecución de casos de prueba en aplicaciones web.', 'Ingeniería de Sistemas', 7, 80, 'hibrida', 2, 18, 'publicada'),
    ('00000000002', 'Practicante de redes y comunicaciones', 'Apoyo en cableado estructurado, configuración de equipos de red y monitoreo.', 'Ingeniería de Sistemas', 9, 120, 'presencial', 1, 55, 'publicada'),
    ('00000000002', 'Practicante de bases de datos', 'Respaldo, consultas SQL y optimización básica en PostgreSQL.', 'Ingeniería de Sistemas', 8, 100, 'hibrida', 2, 33, 'publicada'),
    -- Ingeniería Civil
    ('00000000003', 'Practicante de supervisión de obra', 'Control de avance, registro de cuaderno de obra y apoyo en campo.', 'Ingeniería Civil', 8, 110, 'presencial', 2, 30, 'publicada'),
    ('00000000003', 'Practicante de topografía', 'Levantamientos topográficos, replanteo y procesamiento de datos.', 'Ingeniería Civil', 7, 90, 'presencial', 2, 21, 'publicada'),
    ('00000000003', 'Practicante de metrados y presupuestos', 'Elaboración de metrados, análisis de costos y valorizaciones.', 'Ingeniería Civil', 9, 130, 'hibrida', 1, 45, 'publicada'),
    ('00000000003', 'Practicante de dibujo CAD', 'Elaboración y actualización de planos en AutoCAD.', 'Ingeniería Civil', 6, 60, 'remota', 3, 12, 'publicada'),
    -- Ingeniería Agronómica
    ('00000000004', 'Practicante de control de calidad en campo', 'Inspección de cultivos, toma de muestras y registro de resultados.', 'Ingeniería Agronómica', 8, 100, 'presencial', 4, 28, 'publicada'),
    ('00000000004', 'Practicante de trazabilidad agrícola', 'Registro de lotes y apoyo en certificaciones de calidad.', 'Ingeniería Agronómica', 9, 120, 'hibrida', 2, 50, 'publicada'),
    ('00000000004', 'Practicante de riego tecnificado', 'Apoyo en instalación y mantenimiento de sistemas de riego.', 'Ingeniería Agronómica', 7, 90, 'presencial', 3, 35, 'publicada'),
    -- Contabilidad
    ('00000000005', 'Auxiliar contable', 'Registro de comprobantes, conciliaciones y archivo de documentos.', 'Contabilidad', 6, 70, 'presencial', 2, 22, 'publicada'),
    ('00000000005', 'Practicante de tributación', 'Apoyo en declaraciones mensuales y revisión de libros electrónicos.', 'Contabilidad', 8, 110, 'hibrida', 1, 38, 'publicada'),
    ('00000000005', 'Practicante de auditoría', 'Revisión de saldos, papeles de trabajo y apoyo en informes.', 'Contabilidad', 9, 130, 'presencial', 2, 60, 'publicada'),
    -- Administración de Empresas
    ('00000000002', 'Practicante de atención al cliente', 'Atención de consultas, seguimiento de reclamos y registro en el sistema.', 'Administración de Empresas', 5, 50, 'presencial', 3, 15, 'publicada'),
    ('00000000004', 'Practicante de logística', 'Control de inventarios, coordinación de despachos y reportes.', 'Administración de Empresas', 7, 90, 'presencial', 2, 42, 'publicada'),
    ('00000000002', 'Practicante de marketing digital', 'Gestión de redes sociales, calendario de contenidos y métricas.', 'Administración de Empresas', 6, 70, 'remota', 2, 27, 'publicada'),
    -- Derecho
    ('00000000007', 'Asistente legal', 'Revisión de expedientes, redacción de escritos y apoyo en audiencias.', 'Derecho', 8, 110, 'presencial', 2, 32, 'publicada'),
    ('00000000007', 'Practicante de contratos', 'Elaboración y revisión de contratos civiles y comerciales.', 'Derecho', 9, 125, 'hibrida', 1, 48, 'publicada'),
    -- Enfermería
    ('00000000006', 'Practicante de apoyo en consultorio', 'Toma de signos vitales, registro de historias clínicas y orientación al paciente.', 'Enfermería', 7, 90, 'presencial', 4, 20, 'publicada'),
    ('00000000006', 'Practicante de salud ocupacional', 'Apoyo en campañas de prevención y exámenes ocupacionales.', 'Enfermería', 8, 100, 'presencial', 2, 36, 'publicada'),
    -- Casos que NO deben aparecer en el portal
    ('00000000002', 'Prueba: oferta pendiente de revisión', 'No se muestra porque el coordinador aún no la aprueba.', 'Ingeniería de Sistemas', 6, 0, 'remota', 1, 30, 'pendiente_revision'),
    ('00000000002', 'Prueba: oferta con fecha vencida', 'No se muestra porque su fecha límite ya pasó.', 'Ingeniería de Sistemas', 6, 0, 'remota', 1, -5, 'publicada'),
    ('00000000002', 'Prueba: oferta cerrada', 'No se muestra porque la empresa la cerró.', 'Ingeniería de Sistemas', 6, 0, 'remota', 1, 30, 'cerrada'),
    ('00000000008', 'Prueba: oferta de empresa pendiente', 'No se muestra porque la empresa aún no está aprobada.', 'Contabilidad', 6, 0, 'remota', 1, 30, 'publicada'),
    ('00000000009', 'Prueba: oferta de empresa rechazada', 'No se muestra porque la empresa fue rechazada.', 'Derecho', 6, 0, 'remota', 1, 30, 'publicada')
)
INSERT INTO ofertas.ofertas (
    empresa_id, titulo, descripcion, carrera, ciclo_minimo,
    creditos_minimos, modalidad, vacantes, fecha_limite, estado
)
SELECT
    e.id, n.titulo, n.descripcion, n.carrera, n.ciclo_minimo,
    n.creditos_minimos, n.modalidad, n.vacantes,
    CURRENT_DATE + n.dias, n.estado
FROM nuevas AS n
JOIN ofertas.empresas AS e
  ON e.ruc = n.ruc
WHERE NOT EXISTS (
    SELECT 1
    FROM ofertas.ofertas AS o
    WHERE o.empresa_id = e.id
      AND o.titulo = n.titulo
);

COMMIT;
