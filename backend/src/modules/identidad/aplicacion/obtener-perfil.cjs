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

// Perfiles públicos de varias cuentas a la vez (sin clave), para otros módulos.
function crearObtenerPerfiles({ usuariosRepository }) {
  return async function obtenerPerfiles(ids) {
    return usuariosRepository.buscarPorIds(ids);
  };
}

module.exports = { crearObtenerPerfil, crearObtenerPerfiles };
