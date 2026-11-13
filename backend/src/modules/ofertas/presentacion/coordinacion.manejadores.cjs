const { responderError } = require("./errores-http.cjs");

// Manejadores puros (req, res): se pueden probar sin levantar Express.
function crearManejadores({ listarPendientes, decidirEmpresa, decidirOferta, cerrarOferta }) {
  return {
    async pendientes(req, res) {
      try {
        res.json(await listarPendientes(req.usuario.id));
      } catch (error) {
        responderError(res, error, "listar pendientes");
      }
    },

    // La acción viene de la ruta (aprobar o rechazar); el id del coordinador, del token.
    empresa: (accion) => async (req, res) => {
      try {
        res.json(
          await decidirEmpresa(req.usuario.id, req.params.id, accion, req.body?.motivo)
        );
      } catch (error) {
        responderError(res, error, `${accion} empresa`);
      }
    },

    async cerrar(req, res) {
      try {
        res.json(await cerrarOferta(req.usuario.id, req.params.id, req.body?.motivo));
      } catch (error) {
        responderError(res, error, "cerrar oferta");
      }
    },

    oferta: (accion) => async (req, res) => {
      try {
        res.json(
          await decidirOferta(req.usuario.id, req.params.id, accion, req.body?.motivo)
        );
      } catch (error) {
        responderError(res, error, `${accion} oferta`);
      }
    }
  };
}

module.exports = { crearManejadores };
