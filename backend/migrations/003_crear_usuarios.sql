-- Módulo Identidad: cuentas de usuario y roles.
-- Cada módulo usa su propio esquema; este no tiene claves foráneas hacia "ofertas".
CREATE SCHEMA IF NOT EXISTS identidad;

CREATE TABLE IF NOT EXISTS identidad.usuarios (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    correo            TEXT        NOT NULL,
    hash_clave        TEXT        NOT NULL,
    rol               TEXT        NOT NULL,
    nombre            TEXT        NOT NULL,
    codigo_estudiante TEXT,
    ruc               TEXT,
    razon_social      TEXT,
    activo            BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT usuarios_rol_valido
        CHECK (rol IN ('estudiante', 'empresa', 'coordinador')),
    CONSTRAINT usuarios_correo_minusculas
        CHECK (correo = lower(correo)),
    CONSTRAINT usuarios_estudiante_con_codigo
        CHECK (rol <> 'estudiante' OR COALESCE(codigo_estudiante ~ '^[0-9]{6,10}$', FALSE)),
    CONSTRAINT usuarios_empresa_con_ruc
        CHECK (rol <> 'empresa'
               OR (COALESCE(ruc ~ '^[0-9]{11}$', FALSE) AND razon_social IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_correo_unico
    ON identidad.usuarios (correo);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_codigo_estudiante_unico
    ON identidad.usuarios (codigo_estudiante) WHERE codigo_estudiante IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_ruc_unico
    ON identidad.usuarios (ruc) WHERE ruc IS NOT NULL;
