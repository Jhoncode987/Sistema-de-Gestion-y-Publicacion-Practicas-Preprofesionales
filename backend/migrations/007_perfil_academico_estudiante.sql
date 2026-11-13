-- Perfil académico del estudiante. Hoy lo declara el propio estudiante; cuando
-- exista la integración con SIGA (RC02) este dato vendrá de allí y se verificará.
ALTER TABLE identidad.usuarios
    ADD COLUMN IF NOT EXISTS carrera            TEXT,
    ADD COLUMN IF NOT EXISTS ciclo              SMALLINT,
    ADD COLUMN IF NOT EXISTS creditos_aprobados SMALLINT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_ciclo_valido') THEN
        ALTER TABLE identidad.usuarios
            ADD CONSTRAINT usuarios_ciclo_valido CHECK (ciclo BETWEEN 1 AND 10),
            ADD CONSTRAINT usuarios_creditos_validos CHECK (creditos_aprobados BETWEEN 0 AND 250),
            ADD CONSTRAINT usuarios_perfil_solo_estudiante CHECK (
                rol = 'estudiante'
                OR (carrera IS NULL AND ciclo IS NULL AND creditos_aprobados IS NULL)
            );
    END IF;
END $$;
