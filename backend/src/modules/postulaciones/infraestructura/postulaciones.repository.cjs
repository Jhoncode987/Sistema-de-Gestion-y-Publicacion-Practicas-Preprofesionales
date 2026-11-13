const COLUMNAS = `
  id::text, oferta_id::text AS "ofertaId", estudiante_id::text AS "estudianteId",
  estado, motivo, creada_en AS "creadaEn", decidida_en AS "decididaEn",
  finalizada_en AS "finalizadaEn"`;

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
          ORDER BY CASE estado WHEN 'pendiente' THEN 0 WHEN 'aceptada' THEN 1 WHEN 'finalizada' THEN 2 ELSE 3 END,
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

    // Solo una práctica aceptada puede finalizar; la vacante sigue ocupada.
    async finalizar(id) {
      const { rows } = await pool.query(
        `UPDATE postulaciones.postulaciones
            SET estado = 'finalizada', finalizada_en = now()
          WHERE id = $1 AND estado = 'aceptada'
          RETURNING ${COLUMNAS}`,
        [id]
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
    async tieneAceptada(estudianteId) {
      const { rows } = await pool.query(
        `SELECT 1 FROM postulaciones.postulaciones
          WHERE estudiante_id = $1 AND estado = 'aceptada' LIMIT 1`,
        [estudianteId]
      );

      return rows.length > 0;
    },

    // Un estudiante solo puede tener una práctica aceptada: además del candado
    // de la oferta se toma uno por estudiante (clave negativa, no choca con las
    // ofertas) y, al aceptar, se retiran sus demás postulaciones pendientes.
    async aceptar({ id, ofertaId, estudianteId, vacantes }) {
      const cliente = await pool.connect();

      try {
        await cliente.query("BEGIN");
        await cliente.query("SELECT pg_advisory_xact_lock($1::bigint)", [ofertaId]);

        await cliente.query("SELECT pg_advisory_xact_lock(-($1::bigint))", [estudianteId]);

        const yaAceptado = await cliente.query(
          `SELECT 1 FROM postulaciones.postulaciones
            WHERE estudiante_id = $1 AND estado = 'aceptada' LIMIT 1`,
          [estudianteId]
        );

        if (yaAceptado.rows.length > 0) {
          await cliente.query("ROLLBACK");
          return { resultado: "YA_ACEPTADO" };
        }

        const conteo = await cliente.query(
          `SELECT count(*)::int AS n FROM postulaciones.postulaciones
            WHERE oferta_id = $1 AND estado IN ('aceptada', 'finalizada')`,
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

        const retiradas = await cliente.query(
          `UPDATE postulaciones.postulaciones
              SET estado = 'retirada', motivo = 'Aceptado en otra práctica', decidida_en = now()
            WHERE estudiante_id = $1 AND estado = 'pendiente' AND id <> $2
            RETURNING 1`,
          [estudianteId, id]
        );

        await cliente.query("COMMIT");

        return {
          resultado: "ACEPTADA",
          retiradas: retiradas.rows.length,
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
