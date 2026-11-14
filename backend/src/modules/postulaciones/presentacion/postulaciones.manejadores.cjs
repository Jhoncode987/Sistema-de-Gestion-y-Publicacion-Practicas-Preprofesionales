const { responderError } = require("./errores-http.cjs");

// Manejadores puros (req, res): se prueban sin levantar Express.
function crearManejadores({
  postular,
  listarMisPostulaciones,
  retirarPostulacion,
  listarPostulantes,
  decidirPostulacion,
  finalizarPractica,
  verPostulacionesCoordinacion
}) {
  const envolver = (contexto, estado, fn) => async (req, res) => {
    try {
      res.status(estado).json(await fn(req));
    } catch (error) {
      responderError(res, error, contexto);
    }
  };

  return {
    postular: envolver("postular", 201, (req) => postular(req.usuario.id, req.body)),
    mias: envolver("listar postulaciones", 200, (req) => listarMisPostulaciones(req.usuario.id)),
    retirar: envolver("retirar postulación", 200, (req) =>
      retirarPostulacion(req.usuario.id, req.params.id)
    ),
    postulantes: envolver("listar postulantes", 200, (req) =>
      listarPostulantes(req.usuario.id, req.params.ofertaId)
    ),
    aceptar: envolver("aceptar postulación", 200, (req) =>
      decidirPostulacion.aceptar(req.usuario.id, req.params.id)
    ),
    coordinacion: envolver("ver postulaciones", 200, (req) =>
      verPostulacionesCoordinacion(req.usuario.id, req.query)
    ),
    finalizar: envolver("finalizar práctica", 200, (req) =>
      finalizarPractica(req.usuario.id, req.params.id)
    ),
    rechazar: envolver("rechazar postulación", 200, (req) =>
      decidirPostulacion.rechazar(req.usuario.id, req.params.id, req.body)
    )
  };
}

module.exports = { crearManejadores };
