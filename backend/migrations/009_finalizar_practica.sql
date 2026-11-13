-- Una práctica aceptada puede marcarse como finalizada; así el estudiante
-- queda libre para postular de nuevo y la práctica queda en su historial.
ALTER TABLE postulaciones.postulaciones
    ADD COLUMN IF NOT EXISTS finalizada_en TIMESTAMPTZ;

ALTER TABLE postulaciones.postulaciones
    DROP CONSTRAINT IF EXISTS postulaciones_estado_check;

ALTER TABLE postulaciones.postulaciones
    ADD CONSTRAINT postulaciones_estado_check
    CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'retirada', 'finalizada'));
