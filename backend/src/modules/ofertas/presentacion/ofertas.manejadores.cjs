const { ConsultaInvalidaError } = require("../aplicacion/listar-ofertas.cjs");
const {
  OfertaInvalidaError,
  AccesoDenegadoError,
  RucEnUsoError
} = require("../aplicacion/errores.cjs");

function responderError(res, error, contexto) {
  if (error instanceof ConsultaInvalidaError) {
    return res.status(400).json({
      codigo: "PARAMETROS_INVALIDOS",
      mensaje: error.message
    });
  }

  if (error instanceof OfertaInvalidaError) {
    return res.status(400).json({ codigo: "DATOS_INVALIDOS", mensaje: error.message });
  }

  if (error instanceof AccesoDenegadoError) {
    return res.status(403).json({ codigo: "ACCESO_DENEGADO", mensaje: error.message });
  }

  if (error instanceof RucEnUsoError) {
    return res.status(409).json({ codigo: "RUC_EN_USO", mensaje: error.message });
  }

  console.error(`Error al ${contexto}:`, error.code ?? error.name);

  return res.status(503).json({
    codigo: "SERVICIO_NO_DISPONIBLE",
    mensaje: "No se pudo completar la solicitud"
  });
}

// Manejadores puros (req, res): se pueden probar sin levantar Express.
function crearManejadores({ listarOfertas, listarFiltros, publicarOferta, listarMisOfertas }) {
  return {
    async filtros(req, res) {
      try {
        res.json(await listarFiltros());
      } catch (error) {
        responderError(res, error, "listar filtros");
      }
    },

    async listar(req, res) {
      try {
        res.json(await listarOfertas(req.query));
      } catch (error) {
        responderError(res, error, "listar ofertas");
      }
    },

    async publicar(req, res) {
      try {
        res.status(201).json(await publicarOferta(req.usuario.id, req.body));
      } catch (error) {
        responderError(res, error, "publicar oferta");
      }
    },

    async mias(req, res) {
      try {
        res.json(await listarMisOfertas(req.usuario.id));
      } catch (error) {
        responderError(res, error, "listar mis ofertas");
      }
    }
  };
}

module.exports = { crearManejadores };
