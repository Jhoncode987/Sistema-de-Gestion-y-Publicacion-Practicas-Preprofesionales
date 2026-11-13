function crearObtenerPerfil({ usuariosRepository }) {
  return async function obtenerPerfil(id) {
    const registro = await usuariosRepository.buscarPorId(id);

    if (!registro || !registro.activo) {
      return null;
    }

    const { hashClave, ...usuario } = registro;

    return usuario;
  };
}

module.exports = { crearObtenerPerfil };
