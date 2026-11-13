const express = require("express");

const { crearManejadores } = require("./coordinacion.manejadores.cjs");

// El acceso por rol (solo coordinador) se aplica al montar el router en server.cjs.
function crearCoordinacionRouter(casosDeUso) {
  const router = express.Router();
  const m = crearManejadores(casosDeUso);

  router.get("/pendientes", m.pendientes);
  router.post("/empresas/:id/aprobar", m.empresa("aprobar"));
  router.post("/empresas/:id/rechazar", m.empresa("rechazar"));
  router.post("/ofertas/:id/aprobar", m.oferta("aprobar"));
  router.post("/ofertas/:id/rechazar", m.oferta("rechazar"));
  router.post("/ofertas/:id/cerrar", m.cerrar);

  return router;
}

module.exports = { crearCoordinacionRouter };
