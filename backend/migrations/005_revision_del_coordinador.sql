-- Revisión del coordinador (RF01): motivo del rechazo y quién decidió y cuándo.
-- "decidido_por" guarda el id del usuario coordinador sin clave foránea entre esquemas.
ALTER TABLE ofertas.empresas
    ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
    ADD COLUMN IF NOT EXISTS decidido_por   BIGINT,
    ADD COLUMN IF NOT EXISTS decidido_en    TIMESTAMPTZ;

ALTER TABLE ofertas.ofertas
    ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
    ADD COLUMN IF NOT EXISTS decidido_por   BIGINT,
    ADD COLUMN IF NOT EXISTS decidido_en    TIMESTAMPTZ;
