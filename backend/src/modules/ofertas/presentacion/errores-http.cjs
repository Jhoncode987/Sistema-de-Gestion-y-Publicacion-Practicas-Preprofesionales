const { ConsultaInvalidaError } = require("../aplicacion/listar-ofertas.cjs");
const {
  OfertaInvalidaError,
  AccesoDenegadoError,
  RucEnUsoError,
  NoEncontradoError,
  TransicionInvalidaError
} = require("../aplicacion/errores.cjs");

// Traduce los errores del módulo a { codigo, mensaje } sin filtrar detalles internos.
function responderError(res, error, contexto) {
  const conocidos = [
    [ConsultaInvalidaError, 400, () => "PARAMETROS_INVALIDOS"],
    [OfertaInvalidaError, 400, () => "DATOS_INVALIDOS"],
    [AccesoDenegadoError, 403, () => "ACCESO_DENEGADO"],
    [NoEncontradoError, 404, () => "NO_ENCONTRADO"],
    [RucEnUsoError, 409, () => "RUC_EN_USO"],
    [TransicionInvalidaError, 409, (e) => e.codigo]
  ];

  for (const [Clase, estado, codigo] of conocidos) {
    if (error instanceof Clase) {
      return res.status(estado).json({ codigo: codigo(error), mensaje: error.message });
    }
  }

  console.error(`Error al ${contexto}:`, error.code ?? error.name);

  return res.status(503).json({
    codigo: "SERVICIO_NO_DISPONIBLE",
    mensaje: "No se pudo completar la solicitud"
  });
}

module.exports = { responderError };
