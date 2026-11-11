function crearListarOfertas(ofertasRepository) {
  return async function listarOfertas() {
    const ofertas = await ofertasRepository.listarPublicadas();

    return {
      cantidad: ofertas.length,
      ofertas
    };
  };
}

module.exports = { crearListarOfertas };