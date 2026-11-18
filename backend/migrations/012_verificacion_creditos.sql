-- Verificación manual de créditos: el estudiante sube su reporte de notas (PDF)
-- y la coordinación revisa el documento, suma los créditos y registra el total.
-- Mientras no exista integración con SIGA, solo cuentan los créditos verificados.
ALTER TABLE identidad.usuarios
    ADD COLUMN IF NOT EXISTS creditos_verificados_en TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS creditos_verificados_por BIGINT REFERENCES identidad.usuarios(id);

ALTER TABLE identidad.usuarios
    DROP CONSTRAINT IF EXISTS usuarios_verificacion_check;

ALTER TABLE identidad.usuarios
    ADD CONSTRAINT usuarios_verificacion_check
    CHECK (creditos_verificados_en IS NULL OR (rol = 'estudiante' AND creditos_aprobados IS NOT NULL));

-- Un reporte vigente por estudiante (el último que subió). Límite de 2 MB.
CREATE TABLE IF NOT EXISTS identidad.reportes_notas (
    usuario_id BIGINT PRIMARY KEY REFERENCES identidad.usuarios(id),
    contenido BYTEA NOT NULL,
    subido_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT reporte_tamano_valido CHECK (octet_length(contenido) BETWEEN 5 AND 2097152)
);
