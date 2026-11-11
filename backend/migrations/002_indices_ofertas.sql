BEGIN;

-- Acelera el listado de ofertas publicadas y vigentes (EQ-01).
CREATE INDEX IF NOT EXISTS ofertas_estado_fecha_limite_idx
    ON ofertas.ofertas (estado, fecha_limite);

-- Acelera la unión con empresas y las consultas por empresa.
CREATE INDEX IF NOT EXISTS ofertas_empresa_id_idx
    ON ofertas.ofertas (empresa_id);

COMMIT;
