const COLUMNAS = `
  id::text, oferta_id::text AS "ofertaId", estudiante_id::text AS "estudianteId",
  estado, motivo, creada_en AS "creadaEn", decidida_en AS "decididaEn"`;

function crearPostulacionesRepository(pool) {
  return {
    // null si ya existía (restricción única): no hay duplicados ni carreras entre dos clics.
    async crear({ ofertaId, estudianteId }) {
      const { rows } = await pool.query(
        `INSERT INTO postulaciones.postulaciones (oferta_id, estudiante_id)
         VALUES ($1, $2)
         ON CONFLICT (oferta_id, estudiante_id) DO NOTHING
         RETURNING ${COLUMNAS}`,
        [ofertaId, estudianteId]
      );

      return rows[0] ?? null;
    },

    async obtener(id) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNAS} FROM postulaciones.postulaciones WHERE id = $1`,
        [id]
      );

      return rows[0] ?? null;
    },

    async listarPorEstudiante(estudianteId) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNAS} FROM postulaciones.postulaciones
          WHERE estudiante_id = $1 ORDER BY creada_en DESC, id DESC`,
        [estudianteId]
      );

      return rows;
    },

    async listarPorOferta(ofertaId) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNAS} FROM postulaciones.postulaciones
          WHERE oferta_id = $1
          ORDER BY CASE estado WHEN 'pendiente' THEN 0 WHEN 'aceptada' THEN 1 ELSE 2 END,
                   creada_en, id`,
        [ofertaId]
      );

      return rows;
    },

    async retirar({ id, estudianteId }) {
      const { rows } = await pool.query(
        `UPDATE postulaciones.postulaciones
            SET estado = 'retirada', decidida_en = now()
          WHERE id = $1 AND estudiante_id = $2 AND estado = 'pendiente'
          RETURNING ${COLUMNAS}`,
        [id, estudianteId]
      );

      return rows[0] ?? null;
    },

    async rechazar({ id, motivo }) {
      const { rows } = await pool.query(
        `UPDATE postulaciones.postulaciones
            SET estado = 'rechazada', motivo = $2, decidida_en = now()
          WHERE id = $1 AND estado = 'pendiente'
          RETURNING ${COLUMNAS}`,
        [id, motivo]
      );

      return rows[0] ?? null;
    },

    // Acepta sin sobrepasar las vacantes: el candado por oferta serializa las
    // aceptaciones simultáneas y el conteo se hace ya dentro del candado.
    async aceptar({ id, ofertaId, vacantes }) {
      const cliente = await pool.connect();

      try {
        await cliente.query("BEGIN");
        await cliente.query("SELECT pg_advisory_xact_lock($1::bigint)", [ofertaId]);

        const conteo = await cliente.query(
          `SELECT count(*)::int AS n FROM postulaciones.postulaciones
            WHERE oferta_id = $1 AND estado = 'aceptada'`,
          [ofertaId]
        );

        if (Number(conteo.rows[0].n) >= vacantes) {
          await cliente.query("ROLLBACK");
          return { resultado: "SIN_CUPO" };
        }

        const { rows } = await cliente.query(
          `UPDATE postulaciones.postulaciones
              SET estado = 'aceptada', motivo = NULL, decidida_en = now()
            WHERE id = $1 AND estado = 'pendiente'
            RETURNING ${COLUMNAS}`,
          [id]
        );

        if (!rows[0]) {
          await cliente.query("ROLLBACK");
          return { resultado: "TRANSICION" };
        }

        await cliente.query("COMMIT");

        return {
          resultado: "ACEPTADA",
          postulacion: rows[0],
          aceptadas: Number(conteo.rows[0].n) + 1
        };
      } catch (error) {
        await cliente.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        cliente.release();
      }
    },

    async rechazarPendientesDeOferta(ofertaId, motivo) {
      const { rowCount } = await pool.query(
        `UPDATE postulaciones.postulaciones
            SET estado = 'rechazada', motivo = $2, decidida_en = now()
          WHERE oferta_id = $1 AND estado = 'pendiente'`,
        [ofertaId, motivo]
      );

      return rowCount;
    }
  };
}

module.exports = { crearPostulacionesRepository };
