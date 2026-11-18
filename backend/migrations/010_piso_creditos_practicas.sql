-- Norma de la Escuela: las prácticas pre-profesionales exigen un mínimo de
-- 160 créditos aprobados. Ninguna oferta puede pedir menos.
UPDATE ofertas.ofertas SET creditos_minimos = 160 WHERE creditos_minimos < 160;

ALTER TABLE ofertas.ofertas ALTER COLUMN creditos_minimos SET DEFAULT 160;

ALTER TABLE ofertas.ofertas DROP CONSTRAINT IF EXISTS oferta_creditos_validos;

ALTER TABLE ofertas.ofertas
    ADD CONSTRAINT oferta_creditos_validos CHECK (creditos_minimos >= 160);
