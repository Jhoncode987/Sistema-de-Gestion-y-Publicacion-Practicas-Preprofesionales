const express = require("express");

function crearOfertasRouter(listarOfertas) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const resultado = await listarOfertas();

      res.json({
        estado: "ok",
        ...resultado
      });
    } catch (error) {
      console.error("Error al listar ofertas:", error.code);

      res.status(503).json({
        estado: "error",
        mensaje: "No se pudieron consultar las ofertas"
      });
    }
  });

  return router;
}

module.exports = { crearOfertasRouter };