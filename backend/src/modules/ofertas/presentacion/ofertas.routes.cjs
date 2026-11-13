const express = require("express");

const {
  ConsultaInvalidaError
} = require("../aplicacion/listar-ofertas.cjs");

function responderError(res, error, contexto) {
  if (error instanceof ConsultaInvalidaError) {
    return res.status(400).json({
      codigo: "PARAMETROS_INVALIDOS",
      mensaje: error.message
    });
  }

  console.error(`Error al ${contexto}:`, error.code);

  return res.status(503).json({
    codigo: "SERVICIO_NO_DISPONIBLE",
    mensaje: "No se pudieron consultar las ofertas"
  });
}

function crearOfertasRouter({ listarOfertas, listarFiltros }) {
  const router = express.Router();

  router.get("/filtros", async (req, res) => {
    try {
      res.json(await listarFiltros());
    } catch (error) {
      responderError(res, error, "listar filtros");
    }
  });

  router.get("/", async (req, res) => {
    try {
      res.json(await listarOfertas(req.query));
    } catch (error) {
      responderError(res, error, "listar ofertas");
    }
  });

  return router;
}

module.exports = { crearOfertasRouter };
