-- Cada empresa pertenece a la cuenta de usuario que la registró.
-- No hay clave foránea hacia "identidad": cada módulo conserva su esquema y se
-- comunican por sus casos de uso, no por tablas compartidas.
ALTER TABLE ofertas.empresas
    ADD COLUMN IF NOT EXISTS propietario_usuario_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS empresas_propietario_unico
    ON ofertas.empresas (propietario_usuario_id)
    WHERE propietario_usuario_id IS NOT NULL;
