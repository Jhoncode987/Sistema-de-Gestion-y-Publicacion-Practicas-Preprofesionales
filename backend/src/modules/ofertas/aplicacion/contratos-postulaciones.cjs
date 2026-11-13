const MOTIVO_CUPO_LLENO = "Vacantes completas";

// Fachada que el módulo Postulaciones usa para hablar con Ofertas: así no
// toca sus tablas ni conoce su repositorio.
function crearContratosParaPostulaciones({ ofertasRepository }) {
  return {
    obtenerOfertaParaPostular: (id) => ofertasRepository.obtenerOfertaParaPostular(id),
    obtenerOfertasPorIds: (ids) => ofertasRepository.obtenerOfertasPorIds(ids),
    obtenerOfertaDeEmpresaUsuario: (usuarioId, ofertaId) =>
      ofertasRepository.obtenerOfertaDePropietario(usuarioId, ofertaId),
    cerrarPorCupoLleno: (id) => ofertasRepository.cerrarOfertaPorCupoLleno(id, MOTIVO_CUPO_LLENO)
  };
}

module.exports = { crearContratosParaPostulaciones, MOTIVO_CUPO_LLENO };
