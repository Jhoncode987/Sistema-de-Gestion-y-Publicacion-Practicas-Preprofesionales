const { MODALIDADES } = require("./listar-ofertas.cjs");

// Valores que el portal ofrece en los filtros de búsqueda.
function crearListarFiltros(ofertasRepository) {
  return async function listarFiltros() {
    const carreras = await ofertasRepository.listarCarreras();

    return {
      carreras,
      modalidades: MODALIDADES
    };
  };
}

module.exports = { crearListarFiltros };
