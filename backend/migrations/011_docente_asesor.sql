-- La coordinación designa un docente asesor para monitorear cada práctica
-- aceptada. Se guarda como nombre: los docentes aún no son usuarios del sistema.
ALTER TABLE postulaciones.postulaciones
    ADD COLUMN IF NOT EXISTS asesor_nombre VARCHAR(120),
    ADD COLUMN IF NOT EXISTS asesor_asignado_en TIMESTAMPTZ;

ALTER TABLE postulaciones.postulaciones
    DROP CONSTRAINT IF EXISTS postulaciones_asesor_check;

ALTER TABLE postulaciones.postulaciones
    ADD CONSTRAINT postulaciones_asesor_check
    CHECK (asesor_nombre IS NULL OR (estado IN ('aceptada', 'finalizada') AND length(btrim(asesor_nombre)) >= 3));
