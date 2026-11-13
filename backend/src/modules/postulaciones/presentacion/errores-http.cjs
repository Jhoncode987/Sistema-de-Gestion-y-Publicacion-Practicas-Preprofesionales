const {
  AccesoDenegadoError,
  NoEncontradoError,
  DatosInvalidosError,
  ReglaDeNegocioError
} = require("../aplicacion/errores.cjs");

function responderError(res, error, contexto) {
  if (error instanceof AccesoDenegadoError) {
    return res.status(403).json({ codigo: "ACCESO_DENEGADO", mensaje: error.message });
  }

  if (error instanceof NoEncontradoError) {
    return res.status(404).json({ codigo: "NO_ENCONTRADO", mensaje: error.message });
  }

  if (error instanceof DatosInvalidosError) {
    return res.status(400).json({ codigo: "DATOS_INVALIDOS", mensaje: error.message });
  }

  if (error instanceof ReglaDeNegocioError) {
    const cuerpo = { codigo: error.codigo, mensaje: error.message };

    if (error.detalle.length > 0) {
      cuerpo.motivos = error.detalle;
    }

    return res.status(409).json(cuerpo);
  }

  console.error(`Error al ${contexto}:`, error.code ?? error.name);

  return res.status(503).json({
    codigo: "SERVICIO_NO_DISPONIBLE",
    mensaje: "No se pudo completar la solicitud"
  });
}

module.exports = { responderError };
