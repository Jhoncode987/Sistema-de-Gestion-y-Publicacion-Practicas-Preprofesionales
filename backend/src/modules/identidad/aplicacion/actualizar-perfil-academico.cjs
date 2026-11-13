const { AccesoDenegadoError } = require("./errores.cjs");
const { validarPerfilAcademico } = require("./registrar-usuario.cjs");

function crearActualizarPerfilAcademico({ usuariosRepository }) {
  return async function actualizarPerfilAcademico(usuarioId, entrada) {
    const datos = validarPerfilAcademico(entrada);
    const usuario = await usuariosRepository.actualizarPerfilAcademico(usuarioId, datos);

    if (!usuario) {
      throw new AccesoDenegadoError("Solo los estudiantes tienen perfil académico");
    }

    return usuario;
  };
}

module.exports = { crearActualizarPerfilAcademico };
