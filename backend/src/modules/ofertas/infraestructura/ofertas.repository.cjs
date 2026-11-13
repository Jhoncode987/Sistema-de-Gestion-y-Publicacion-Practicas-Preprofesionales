const { RucEnUsoError } = require("../aplicacion/errores.cjs");

const COLUMNAS_OFERTA = `
  o.id, e.razon_social AS empresa, o.titulo, o.descripcion, o.carrera,
  o.ciclo_minimo, o.creditos_minimos, o.modalidad, o.vacantes,
  o.fecha_limite, o.estado`;

const COLUMNAS_EMPRESA =
  'id, ruc, razon_social AS "razonSocial", estado, motivo_rechazo AS "motivoRechazo"';

// Escapa los caracteres comodín de LIKE para que el texto buscado sea literal.
function escaparLike(texto) {
  return texto.replace(/[\\%_]/g, "\\$&");
}

// Arma el WHERE con parámetros ($1, $2...): el texto del usuario nunca se
// concatena en el SQL.
function construirFiltros({ q, modalidad, carrera, ciclo }) {
  const condiciones = [
    "o.estado = 'publicada'",
    "e.estado = 'aprobada'",
    "o.fecha_limite >= CURRENT_DATE"
  ];
  const valores = [];

  function agregar(condicion, valor) {
    valores.push(valor);
    condiciones.push(condicion.replaceAll("?", `$${valores.length}`));
  }

  if (q) {
    agregar(
      "(o.titulo ILIKE ? OR o.descripcion ILIKE ? OR e.razon_social ILIKE ?)",
      `%${escaparLike(q)}%`
    );
  }

  if (modalidad) {
    agregar("o.modalidad = ?", modalidad);
  }

  if (carrera) {
    agregar("LOWER(o.carrera) = LOWER(?)", carrera);
  }

  if (ciclo) {
    agregar("o.ciclo_minimo <= ?", ciclo);
  }

  return { donde: condiciones.join(" AND "), valores };
}

function crearOfertasRepository(pool) {
  return {
    async listarPublicadas(consulta) {
      const { donde, valores } = construirFiltros(consulta);
      const { page, pageSize } = consulta;
      const siguiente = valores.length;

      const [conteo, filas] = await Promise.all([
        pool.query(
          `
          SELECT COUNT(*)::int AS total
          FROM ofertas.ofertas AS o
          JOIN ofertas.empresas AS e
            ON e.id = o.empresa_id
          WHERE ${donde}
          `,
          valores
        ),
        pool.query(
          `
          SELECT
            o.id,
            e.razon_social AS empresa,
            o.titulo,
            o.descripcion,
            o.carrera,
            o.ciclo_minimo,
            o.creditos_minimos,
            o.modalidad,
            o.vacantes,
            o.fecha_limite,
            o.estado
          FROM ofertas.ofertas AS o
          JOIN ofertas.empresas AS e
            ON e.id = o.empresa_id
          WHERE ${donde}
          ORDER BY o.id DESC
          LIMIT $${siguiente + 1} OFFSET $${siguiente + 2}
          `,
          [...valores, pageSize, (page - 1) * pageSize]
        )
      ]);

      return { items: filas.rows, total: conteo.rows[0].total };
    },

    // Cada cuenta de empresa tiene una sola fila de empresa; se crea al primer uso.
    async obtenerOCrearEmpresa({ usuarioId, ruc, razonSocial }) {
      const buscar = async () =>
        (
          await pool.query(
            `SELECT ${COLUMNAS_EMPRESA} FROM ofertas.empresas
              WHERE propietario_usuario_id = $1`,
            [usuarioId]
          )
        ).rows[0];

      const existente = await buscar();

      if (existente) {
        return existente;
      }

      try {
        const { rows } = await pool.query(
          `INSERT INTO ofertas.empresas (ruc, razon_social, propietario_usuario_id)
           VALUES ($1, $2, $3)
           RETURNING ${COLUMNAS_EMPRESA}`,
          [ruc, razonSocial, usuarioId]
        );

        return rows[0];
      } catch (error) {
        if (error.code !== "23505") {
          throw error;
        }

        // Dos solicitudes simultáneas de la misma cuenta: gana la primera.
        const creada = await buscar();

        if (creada) {
          return creada;
        }

        throw new RucEnUsoError();
      }
    },

    async crearOferta({ empresaId, ...d }) {
      const { rows } = await pool.query(
        `WITH nueva AS (
           INSERT INTO ofertas.ofertas
             (empresa_id, titulo, descripcion, carrera, ciclo_minimo,
              creditos_minimos, modalidad, vacantes, fecha_limite)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *
         )
         SELECT ${COLUMNAS_OFERTA}
           FROM nueva AS o
           JOIN ofertas.empresas AS e ON e.id = o.empresa_id`,
        [
          empresaId, d.titulo, d.descripcion, d.carrera, d.ciclo_minimo,
          d.creditos_minimos, d.modalidad, d.vacantes, d.fecha_limite
        ]
      );

      return rows[0];
    },

    async listarPorEmpresa(empresaId) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNAS_OFERTA}, o.motivo_rechazo AS "motivoRechazo",
                o.motivo_cierre AS "motivoCierre"
           FROM ofertas.ofertas AS o
           JOIN ofertas.empresas AS e ON e.id = o.empresa_id
          WHERE o.empresa_id = $1
          ORDER BY o.id DESC
          LIMIT 200`,
        [empresaId]
      );

      return rows;
    },

    // --- Revisión del coordinador ---

    async listarEmpresasPorEstado(estado) {
      const { rows } = await pool.query(
        `SELECT e.id, e.ruc, e.razon_social AS "razonSocial", e.estado,
                e.creada_en AS "creadaEn",
                (SELECT COUNT(*)::int FROM ofertas.ofertas AS o
                  WHERE o.empresa_id = e.id) AS "totalOfertas"
           FROM ofertas.empresas AS e
          WHERE e.estado = $1
          ORDER BY e.id
          LIMIT 200`,
        [estado]
      );

      return rows;
    },

    async listarOfertasPorEstado(estado) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNAS_OFERTA}, o.creada_en AS "creadaEn",
                e.estado AS "empresaEstado"
           FROM ofertas.ofertas AS o
           JOIN ofertas.empresas AS e ON e.id = o.empresa_id
          WHERE o.estado = $1
          ORDER BY o.id
          LIMIT 200`,
        [estado]
      );

      return rows;
    },

    async obtenerEmpresa(id) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNAS_EMPRESA} FROM ofertas.empresas WHERE id = $1`,
        [id]
      );

      return rows[0] ?? null;
    },

    // Solo cambia si sigue pendiente: dos coordinadores no pisan la decisión del otro.
    async decidirEmpresa({ id, estado, motivo, decididoPor }) {
      const { rows } = await pool.query(
        `UPDATE ofertas.empresas
            SET estado = $2, motivo_rechazo = $3,
                decidido_por = $4, decidido_en = now()
          WHERE id = $1 AND estado = 'pendiente'
          RETURNING ${COLUMNAS_EMPRESA}`,
        [id, estado, motivo, decididoPor]
      );

      return rows[0] ?? null;
    },

    async obtenerOfertaParaRevision(id) {
      const { rows } = await pool.query(
        `SELECT o.id, o.estado, e.estado AS "empresaEstado"
           FROM ofertas.ofertas AS o
           JOIN ofertas.empresas AS e ON e.id = o.empresa_id
          WHERE o.id = $1`,
        [id]
      );

      return rows[0] ?? null;
    },

    // Publicar exige empresa aprobada y fecha límite vigente; rechazar siempre se puede.
    async decidirOferta({ id, estado, motivo, decididoPor }) {
      const { rows } = await pool.query(
        `WITH actualizada AS (
           UPDATE ofertas.ofertas AS o
              SET estado = $2::text, motivo_rechazo = $3,
                  decidido_por = $4, decidido_en = now()
             FROM ofertas.empresas AS e
            WHERE o.id = $1
              AND e.id = o.empresa_id
              AND o.estado = 'pendiente_revision'
              AND ($2::text = 'rechazada'
                   OR (e.estado = 'aprobada' AND o.fecha_limite >= CURRENT_DATE))
           RETURNING o.*
         )
         SELECT ${COLUMNAS_OFERTA}, o.motivo_rechazo AS "motivoRechazo"
           FROM actualizada AS o
           JOIN ofertas.empresas AS e ON e.id = o.empresa_id`,
        [id, estado, motivo, decididoPor]
      );

      return rows[0] ?? null;
    },

    // --- Cierre de ofertas (no se borran: se conserva el historial) ---

    async obtenerOfertaDeEmpresa(id, empresaId) {
      const { rows } = await pool.query(
        `SELECT id, estado FROM ofertas.ofertas WHERE id = $1 AND empresa_id = $2`,
        [id, empresaId]
      );

      return rows[0] ?? null;
    },

    // La empresa puede retirar una oferta propia en revisión o publicada.
    async cerrarOfertaDeEmpresa({ id, empresaId }) {
      const { rows } = await pool.query(
        `WITH cerrada AS (
           UPDATE ofertas.ofertas
              SET estado = 'cerrada'
            WHERE id = $1 AND empresa_id = $2
              AND estado IN ('publicada', 'pendiente_revision')
           RETURNING *
         )
         SELECT ${COLUMNAS_OFERTA}, o.motivo_rechazo AS "motivoRechazo",
                o.motivo_cierre AS "motivoCierre"
           FROM cerrada AS o
           JOIN ofertas.empresas AS e ON e.id = o.empresa_id`,
        [id, empresaId]
      );

      return rows[0] ?? null;
    },

    // La coordinación solo retira ofertas ya publicadas (las demás se rechazan).
    async cerrarOfertaPorCoordinador({ id, motivo, decididoPor }) {
      const { rows } = await pool.query(
        `WITH cerrada AS (
           UPDATE ofertas.ofertas
              SET estado = 'cerrada', motivo_cierre = $2,
                  decidido_por = $3, decidido_en = now()
            WHERE id = $1 AND estado = 'publicada'
           RETURNING *
         )
         SELECT ${COLUMNAS_OFERTA}, o.motivo_rechazo AS "motivoRechazo",
                o.motivo_cierre AS "motivoCierre"
           FROM cerrada AS o
           JOIN ofertas.empresas AS e ON e.id = o.empresa_id`,
        [id, motivo, decididoPor]
      );

      return rows[0] ?? null;
    },

    async listarCarreras() {
      const resultado = await pool.query(`
        SELECT DISTINCT o.carrera
        FROM ofertas.ofertas AS o
        JOIN ofertas.empresas AS e
          ON e.id = o.empresa_id
        WHERE o.estado = 'publicada'
          AND e.estado = 'aprobada'
          AND o.fecha_limite >= CURRENT_DATE
        ORDER BY o.carrera
      `);

      return resultado.rows.map((fila) => fila.carrera);
    }
  };
}

module.exports = { crearOfertasRepository, construirFiltros };
