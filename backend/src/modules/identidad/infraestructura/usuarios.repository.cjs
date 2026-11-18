const { CuentaDuplicadaError } = require("../aplicacion/errores.cjs");

const COLUMNAS_PUBLICAS = `
    id::text AS id, correo, rol, nombre,
    codigo_estudiante AS "codigoEstudiante",
    ruc, razon_social AS "razonSocial", activo,
    carrera, ciclo, creditos_aprobados AS "creditosAprobados",
    (creditos_verificados_en IS NOT NULL) AS "creditosVerificados",
    creditos_verificados_en AS "creditosVerificadosEn",
    EXISTS (SELECT 1 FROM identidad.reportes_notas r WHERE r.usuario_id = usuarios.id) AS "tieneReporte"`;

function crearUsuariosRepository(pool) {
  return {
    async crear(d) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO identidad.usuarios
             (correo, hash_clave, rol, nombre, codigo_estudiante, ruc, razon_social,
              carrera, ciclo, creditos_aprobados)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING ${COLUMNAS_PUBLICAS}`,
          [
            d.correo,
            d.hashClave,
            d.rol,
            d.nombre,
            d.codigoEstudiante ?? null,
            d.ruc ?? null,
            d.razonSocial ?? null,
            d.carrera ?? null,
            d.ciclo ?? null,
            d.creditosAprobados ?? null
          ]
        );

        return rows[0];
      } catch (error) {
        if (error.code === "23505") {
          throw new CuentaDuplicadaError();
        }

        throw error;
      }
    },

    // Solo cuentas de estudiante tienen perfil académico.
    async actualizarPerfilAcademico(id, d) {
      const { rows } = await pool.query(
        `UPDATE identidad.usuarios
            SET carrera = $2, ciclo = $3,
                -- Si cambian los créditos declarados, la verificación se pierde.
                creditos_verificados_en = CASE WHEN creditos_aprobados IS DISTINCT FROM $4
                                               THEN NULL ELSE creditos_verificados_en END,
                creditos_verificados_por = CASE WHEN creditos_aprobados IS DISTINCT FROM $4
                                                THEN NULL ELSE creditos_verificados_por END,
                creditos_aprobados = $4
          WHERE id = $1 AND rol = 'estudiante' AND activo
          RETURNING ${COLUMNAS_PUBLICAS}`,
        [id, d.carrera, d.ciclo, d.creditosAprobados]
      );

      return rows[0] ?? null;
    },

    // Un reporte por estudiante: subir otro reemplaza el anterior.
    async guardarReporte(usuarioId, contenido) {
      await pool.query(
        `INSERT INTO identidad.reportes_notas (usuario_id, contenido)
         VALUES ($1, $2)
         ON CONFLICT (usuario_id) DO UPDATE SET contenido = EXCLUDED.contenido, subido_en = now()`,
        [usuarioId, contenido]
      );
    },

    async obtenerReporte(usuarioId) {
      const { rows } = await pool.query(
        `SELECT contenido FROM identidad.reportes_notas WHERE usuario_id = $1`,
        [usuarioId]
      );

      return rows[0]?.contenido ?? null;
    },

    // Lista de estudiantes para la coordinación; los pendientes con reporte primero.
    async listarEstudiantes({ estado, limite, desplazamiento }) {
      const filtro = `rol = 'estudiante' AND activo
        AND ($1::text = 'todos'
             OR ($1 = 'verificados' AND creditos_verificados_en IS NOT NULL)
             OR ($1 = 'pendientes' AND creditos_verificados_en IS NULL))`;
      const { rows } = await pool.query(
        `SELECT ${COLUMNAS_PUBLICAS} FROM identidad.usuarios
          WHERE ${filtro}
          ORDER BY (creditos_verificados_en IS NULL AND EXISTS
                     (SELECT 1 FROM identidad.reportes_notas r WHERE r.usuario_id = usuarios.id)) DESC,
                   nombre, id
          LIMIT $2 OFFSET $3`,
        [estado, limite, desplazamiento]
      );
      const total = await pool.query(
        `SELECT count(*)::int AS n FROM identidad.usuarios WHERE ${filtro}`,
        [estado]
      );

      return { items: rows, total: Number(total.rows[0].n) };
    },

    // Solo si ya subió su reporte; guarda los créditos que sumó la coordinación.
    async verificarCreditos({ id, creditos, coordinadorId }) {
      const { rows } = await pool.query(
        `UPDATE identidad.usuarios
            SET creditos_aprobados = $2, creditos_verificados_en = now(),
                creditos_verificados_por = $3
          WHERE id = $1 AND rol = 'estudiante' AND activo
            AND EXISTS (SELECT 1 FROM identidad.reportes_notas r WHERE r.usuario_id = usuarios.id)
          RETURNING ${COLUMNAS_PUBLICAS}`,
        [id, creditos, coordinadorId]
      );

      return rows[0] ?? null;
    },

    // Varios perfiles de una vez (sin hash), para otros módulos.
    async buscarPorIds(ids) {
      const validos = ids.filter((id) => /^\d{1,18}$/.test(String(id)));

      if (validos.length === 0) {
        return [];
      }

      const { rows } = await pool.query(
        `SELECT ${COLUMNAS_PUBLICAS} FROM identidad.usuarios
          WHERE id = ANY($1::bigint[])`,
        [`{${validos.join(",")}}`]
      );

      return rows;
    },

    async buscarPorCorreo(correo) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNAS_PUBLICAS}, hash_clave AS "hashClave"
           FROM identidad.usuarios WHERE correo = $1`,
        [correo]
      );

      return rows[0] ?? null;
    },

    async buscarPorId(id) {
      if (!/^\d{1,18}$/.test(String(id))) {
        return null;
      }

      const { rows } = await pool.query(
        `SELECT ${COLUMNAS_PUBLICAS}, hash_clave AS "hashClave"
           FROM identidad.usuarios WHERE id = $1`,
        [id]
      );

      return rows[0] ?? null;
    }
  };
}

module.exports = { crearUsuariosRepository };
