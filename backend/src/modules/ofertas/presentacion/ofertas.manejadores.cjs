const { responderError } = require("./errores-http.cjs");

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
