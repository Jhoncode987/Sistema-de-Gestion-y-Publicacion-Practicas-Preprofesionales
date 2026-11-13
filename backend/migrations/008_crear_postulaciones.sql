-- Módulo Postulaciones: esquema propio, sin claves foráneas hacia otros esquemas.
-- oferta_id y estudiante_id referencian a Ofertas e Identidad solo por valor.
CREATE SCHEMA IF NOT EXISTS postulaciones;

CREATE TABLE IF NOT EXISTS postulaciones.postulaciones (
    id             BIGSERIAL PRIMARY KEY,
    oferta_id      BIGINT      NOT NULL,
    estudiante_id  BIGINT      NOT NULL,
    estado         TEXT        NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'retirada')),
    motivo         TEXT,
    creada_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    decidida_en    TIMESTAMPTZ,
    -- Una sola postulación por estudiante y oferta (sin duplicados).
    CONSTRAINT postulaciones_unica UNIQUE (oferta_id, estudiante_id)
);

CREATE INDEX IF NOT EXISTS idx_postulaciones_estudiante
    ON postulaciones.postulaciones (estudiante_id, creada_en DESC);
CREATE INDEX IF NOT EXISTS idx_postulaciones_oferta_estado
    ON postulaciones.postulaciones (oferta_id, estado);
