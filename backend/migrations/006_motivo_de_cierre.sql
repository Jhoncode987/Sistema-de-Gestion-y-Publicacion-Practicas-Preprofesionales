-- Una oferta cerrada no se borra: conserva su historial. Si la cierra la
-- coordinación, aquí queda el motivo para que la empresa lo vea.
ALTER TABLE ofertas.ofertas
    ADD COLUMN IF NOT EXISTS motivo_cierre TEXT;
