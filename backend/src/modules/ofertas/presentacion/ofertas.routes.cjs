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
  router.post("/:id/cerrar", soloEmpresa, m.cerrar);

  return router;
}

module.exports = { crearOfertasRouter };
