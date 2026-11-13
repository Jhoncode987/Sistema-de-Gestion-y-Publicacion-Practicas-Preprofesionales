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
  crearListarFiltros
} = require("./src/modules/ofertas/aplicacion/listar-filtros.cjs");

const {
  crearOfertasRouter
} = require("./src/modules/ofertas/presentacion/ofertas.routes.cjs");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const pool = new Pool({
  connectionTimeoutMillis: 5000
});

pool.on("error", () => {
  console.error("Error en una conexión inactiva de PostgreSQL.");
});

app.use(express.json());

// CORS: solo si se define CORS_ORIGIN (por ejemplo, la URL del frontend desplegado).
// En desarrollo no hace falta: Vite redirige /api al backend.
const ORIGEN_PERMITIDO = process.env.CORS_ORIGIN;

if (ORIGEN_PERMITIDO) {
  app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", ORIGEN_PERMITIDO);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });
}

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
    await pool.query("SELECT 1");

    res.json({
      estado: "ok",
      mensaje: "Conexión con PostgreSQL exitosa"
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
const listarFiltros = crearListarFiltros(ofertasRepository);

app.use(
  "/api/v1/ofertas",
  crearOfertasRouter({ listarOfertas, listarFiltros })
);

// Iniciar el servidor después de configurar las rutas.
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
