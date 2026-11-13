const express = require("express");

const { crearManejadores } = require("./ofertas.manejadores.cjs");

// soloEmpresa es el middleware de rol que entrega el módulo Identidad.
function crearOfertasRouter({ soloEmpresa, ...casosDeUso }) {
  const router = express.Router();
  const m = crearManejadores(casosDeUso);

  router.get("/filtros", m.filtros);
  router.get("/mias", soloEmpresa, m.mias);
  router.get("/", m.listar);
  router.post("/", soloEmpresa, m.publicar);

  return router;
}

module.exports = { crearOfertasRouter };
