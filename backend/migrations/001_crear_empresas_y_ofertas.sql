BEGIN;

CREATE SCHEMA IF NOT EXISTS ofertas;

-- Perfil empresarial: separado de las credenciales del usuario.
CREATE TABLE ofertas.empresas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ruc VARCHAR(11) NOT NULL UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    creada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT empresa_estado_valido
        CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),

    CONSTRAINT empresa_ruc_valido
        CHECK (ruc ~ '^[0-9]{11}$')
);

-- Cada oferta requiere su propia aprobación.
CREATE TABLE ofertas.ofertas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    carrera VARCHAR(150) NOT NULL,
    ciclo_minimo SMALLINT NOT NULL,
    creditos_minimos SMALLINT NOT NULL DEFAULT 0,
    modalidad VARCHAR(20) NOT NULL,
    vacantes INTEGER NOT NULL,
    fecha_limite DATE NOT NULL,
    estado VARCHAR(25) NOT NULL DEFAULT 'pendiente_revision',
    creada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT oferta_empresa_fk
        FOREIGN KEY (empresa_id)
        REFERENCES ofertas.empresas(id),

    CONSTRAINT oferta_ciclo_valido
        CHECK (ciclo_minimo > 0),

    CONSTRAINT oferta_creditos_validos
        CHECK (creditos_minimos >= 0),

    CONSTRAINT oferta_vacantes_validas
        CHECK (vacantes > 0),

    CONSTRAINT oferta_modalidad_valida
        CHECK (modalidad IN ('presencial', 'remota', 'hibrida')),

    CONSTRAINT oferta_estado_valido
        CHECK (estado IN (
            'pendiente_revision',
            'publicada',
            'rechazada',
            'cerrada',
            'vencida'
        ))
);

COMMIT;