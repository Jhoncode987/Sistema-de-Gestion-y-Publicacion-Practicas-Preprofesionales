const { CuentaDuplicadaError } = require("../aplicacion/errores.cjs");

const COLUMNAS_PUBLICAS = `
    id::text AS id, correo, rol, nombre,
    codigo_estudiante AS "codigoEstudiante",
    ruc, razon_social AS "razonSocial", activo`;

function crearUsuariosRepository(pool) {
  return {
    async crear(d) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO identidad.usuarios
             (correo, hash_clave, rol, nombre, codigo_estudiante, ruc, razon_social)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING ${COLUMNAS_PUBLICAS}`,
          [
            d.correo,
            d.hashClave,
            d.rol,
            d.nombre,
            d.codigoEstudiante ?? null,
            d.ruc ?? null,
            d.razonSocial ?? null
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
