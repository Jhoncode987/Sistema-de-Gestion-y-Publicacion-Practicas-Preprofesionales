function crearOfertasRepository(pool) {
  return {
    async listarPublicadas() {
      const resultado = await pool.query(`
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
        WHERE o.estado = 'publicada'
          AND e.estado = 'aprobada'
          AND o.fecha_limite >= CURRENT_DATE
        ORDER BY o.id DESC
        LIMIT 20
      `);

      return resultado.rows;
    }
  };
}

module.exports = { crearOfertasRepository };