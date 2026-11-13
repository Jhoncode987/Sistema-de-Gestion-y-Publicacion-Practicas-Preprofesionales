const { CuentaDuplicadaError } = require("../aplicacion/errores.cjs");

const COLUMNAS_PUBLICAS = `
    id::text AS id, correo, rol, nombre,
    codigo_estudiante AS "codigoEstudiante",
    ruc, razon_social AS "razonSocial", activo,
    carrera, ciclo, creditos_aprobados AS "creditosAprobados"`;

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
            SET carrera = $2, ciclo = $3, creditos_aprobados = $4
          WHERE id = $1 AND rol = 'estudiante' AND activo
          RETURNING ${COLUMNAS_PUBLICAS}`,
        [id, d.carrera, d.ciclo, d.creditosAprobados]
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
