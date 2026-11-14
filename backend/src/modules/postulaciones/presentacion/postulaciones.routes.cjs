const express = require("express");

const { crearManejadores } = require("./postulaciones.manejadores.cjs");

function crearPostulacionesRouter({ soloEstudiante, soloEmpresa, empresaOCoordinador, soloCoordinador, ...casosDeUso }) {
  const router = express.Router();
  const m = crearManejadores(casosDeUso);

  // Estudiante
  router.post("/", soloEstudiante, m.postular);
  router.get("/mias", soloEstudiante, m.mias);
  router.post("/:id/retirar", soloEstudiante, m.retirar);

  // Empresa (sobre postulantes de sus propias ofertas)
  router.get("/oferta/:ofertaId", soloEmpresa, m.postulantes);
  router.post("/:id/aceptar", soloEmpresa, m.aceptar);
  router.post("/:id/rechazar", soloEmpresa, m.rechazar);

  // Coordinación: resumen y listado general
  router.get("/coordinacion", soloCoordinador, m.coordinacion);

  // Empresa dueña o coordinación
  router.post("/:id/finalizar", empresaOCoordinador, m.finalizar);

  return router;
}

module.exports = { crearPostulacionesRouter };
