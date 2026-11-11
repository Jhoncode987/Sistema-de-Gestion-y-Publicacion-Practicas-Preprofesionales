require("dotenv").config({
  path: require("node:path").join(__dirname, ".env")
});

const express = require("express");
const { Pool } = require("pg");

const {
  crearOfertasRepository
} = require("./src/modules/ofertas/infraestructura/ofertas.repository.cjs");

const {
  crearListarOfertas
} = require("./src/modules/ofertas/aplicacion/listar-ofertas.cjs");

const {
  crearOfertasRouter
} = require("./src/modules/ofertas/presentacion/ofertas.routes.cjs");

const app = express();
const PORT = 3000;

const pool = new Pool({
  connectionTimeoutMillis: 5000
});

pool.on("error", () => {
  console.error("Error en una conexión inactiva de PostgreSQL.");
});

app.use(express.json());

// Comprobar que el backend funciona.
app.get("/api/v1/salud", (req, res) => {
  res.json({
    estado: "ok",
    mensaje: "Backend de prácticas UNSCH funcionando"
  });
});

// Comprobar la conexión con PostgreSQL.
app.get("/api/v1/salud/db", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT current_database() AS base_de_datos"
    );

    res.json({
      estado: "ok",
      mensaje: "Conexión con PostgreSQL exitosa",
      base_de_datos: resultado.rows[0].base_de_datos
    });
  } catch (error) {
    console.error("Falló la conexión a PostgreSQL:", error.code);

    res.status(503).json({
      estado: "error",
      mensaje: "No se pudo conectar con PostgreSQL"
    });
  }
});

// Conectar las piezas del módulo Ofertas.
const ofertasRepository = crearOfertasRepository(pool);
const listarOfertas = crearListarOfertas(ofertasRepository);

app.use("/api/v1/ofertas", crearOfertasRouter(listarOfertas));

// Iniciar el servidor después de configurar las rutas.
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
