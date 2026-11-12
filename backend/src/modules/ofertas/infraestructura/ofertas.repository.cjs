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
