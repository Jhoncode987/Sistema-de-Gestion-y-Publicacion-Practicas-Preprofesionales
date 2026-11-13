const {
  CredencialesInvalidasError,
  DemasiadosIntentosError
} = require("./errores.cjs");
const { hashearClave, verificarClave } = require("./claves.cjs");

function crearIniciarSesion({ usuariosRepository, tokens, limitador }) {
  // Hash falso para gastar el mismo tiempo cuando el correo no existe.
  const hashFalso = hashearClave("clave-falsa-para-igualar-tiempos");

  return async function iniciarSesion(entrada) {
    const correo =
      typeof entrada?.correo === "string" ? entrada.correo.trim().toLowerCase() : "";
    const clave = typeof entrada?.clave === "string" ? entrada.clave : "";

    if (limitador.bloqueado(correo)) {
      throw new DemasiadosIntentosError();
    }

    const registro = correo ? await usuariosRepository.buscarPorCorreo(correo) : null;
    const correcta = await verificarClave(
      clave,
      registro ? registro.hashClave : await hashFalso
    );

    if (!registro || !registro.activo || !correcta) {
      limitador.registrarFallo(correo);
      throw new CredencialesInvalidasError();
    }

    limitador.reiniciar(correo);

    const { hashClave, ...usuario } = registro;

    return { usuario, token: tokens.emitir(usuario) };
  };
}

module.exports = { crearIniciarSesion };
