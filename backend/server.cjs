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
  crearPublicarOferta,
  crearListarMisOfertas,
  crearCerrarMiOferta
} = require("./src/modules/ofertas/aplicacion/publicar-oferta.cjs");

const {
  crearListarPendientes,
  crearDecidirEmpresa,
  crearDecidirOferta,
  crearCerrarOferta
} = require("./src/modules/ofertas/aplicacion/revision.cjs");

const { crearContratosParaPostulaciones } = require("./src/modules/ofertas/aplicacion/contratos-postulaciones.cjs");
const { crearPostulacionesRepository } = require("./src/modules/postulaciones/infraestructura/postulaciones.repository.cjs");
const {
  crearPostular,
  crearListarMisPostulaciones,
  crearRetirarPostulacion,
  crearListarPostulantes,
  crearDecidirPostulacion
} = require("./src/modules/postulaciones/aplicacion/postulaciones.cjs");
const { crearPostulacionesRouter } = require("./src/modules/postulaciones/presentacion/postulaciones.routes.cjs");

const {
  crearCoordinacionRouter
} = require("./src/modules/ofertas/presentacion/coordinacion.routes.cjs");

const {
  crearOfertasRouter
} = require("./src/modules/ofertas/presentacion/ofertas.routes.cjs");

const { crearUsuariosRepository } = require("./src/modules/identidad/infraestructura/usuarios.repository.cjs");
const { crearServicioTokens } = require("./src/modules/identidad/aplicacion/tokens.cjs");
const { crearLimitadorIntentos } = require("./src/modules/identidad/aplicacion/limitador-intentos.cjs");
const { crearRegistrarUsuario } = require("./src/modules/identidad/aplicacion/registrar-usuario.cjs");
const { crearIniciarSesion } = require("./src/modules/identidad/aplicacion/iniciar-sesion.cjs");
const { crearActualizarPerfilAcademico } = require("./src/modules/identidad/aplicacion/actualizar-perfil-academico.cjs");
const { crearObtenerPerfil, crearObtenerPerfiles } = require("./src/modules/identidad/aplicacion/obtener-perfil.cjs");
const { crearAutenticar, requerirRol } = require("./src/modules/identidad/presentacion/autenticacion.middleware.cjs");
const { crearAuthRouter } = require("./src/modules/identidad/presentacion/auth.routes.cjs");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    "Falta JWT_SECRET (mínimo 32 caracteres) en backend/.env. Consulta .env.example."
  );
  process.exit(1);
}

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
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

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

// Conectar las piezas del módulo Identidad.
const usuariosRepository = crearUsuariosRepository(pool);
const tokens = crearServicioTokens({ secreto: process.env.JWT_SECRET });
const limitador = crearLimitadorIntentos();
const autenticar = crearAutenticar(tokens);
const obtenerPerfil = crearObtenerPerfil({ usuariosRepository });

app.use(
  "/api/v1/auth",
  crearAuthRouter({
    autenticar,
    registrarUsuario: crearRegistrarUsuario({ usuariosRepository, tokens }),
    iniciarSesion: crearIniciarSesion({ usuariosRepository, tokens, limitador }),
    obtenerPerfil,
    actualizarPerfilAcademico: crearActualizarPerfilAcademico({ usuariosRepository })
  })
);

// Ofertas: la consulta es para cualquier usuario con sesión; publicar y ver
// las propias es solo para empresas. Ofertas consulta a Identidad por su caso
// de uso (obtenerPerfil), nunca por sus tablas.
const obtenerPerfilUsuario = (id) => obtenerPerfil(id);

app.use(
  "/api/v1/ofertas",
  autenticar,
  crearOfertasRouter({
    soloEmpresa: requerirRol("empresa"),
    listarOfertas,
    listarFiltros,
    publicarOferta: crearPublicarOferta({ ofertasRepository, obtenerPerfilUsuario }),
    listarMisOfertas: crearListarMisOfertas({ ofertasRepository, obtenerPerfilUsuario }),
    cerrarMiOferta: crearCerrarMiOferta({ ofertasRepository, obtenerPerfilUsuario })
  })
);

// Revisión del coordinador (RF01): rol comprobado en la ruta y otra vez en cada caso de uso.
const revision = { ofertasRepository, obtenerPerfilUsuario };

app.use(
  "/api/v1/coordinacion",
  autenticar,
  requerirRol("coordinador"),
  crearCoordinacionRouter({
    listarPendientes: crearListarPendientes(revision),
    decidirEmpresa: crearDecidirEmpresa(revision),
    decidirOferta: crearDecidirOferta(revision),
    cerrarOferta: crearCerrarOferta(revision)
  })
);

// Postulaciones: habla con Identidad (perfil) y con Ofertas (contratos), nunca con sus tablas.
const obtenerPerfiles = crearObtenerPerfiles({ usuariosRepository });
const contratosOfertas = crearContratosParaPostulaciones({ ofertasRepository });
const postulacionesRepository = crearPostulacionesRepository(pool);
const dependenciasPostulaciones = {
  postulacionesRepository,
  obtenerPerfilUsuario,
  obtenerPerfiles,
  ofertas: contratosOfertas
};

app.use(
  "/api/v1/postulaciones",
  autenticar,
  crearPostulacionesRouter({
    soloEstudiante: requerirRol("estudiante"),
    soloEmpresa: requerirRol("empresa"),
    postular: crearPostular(dependenciasPostulaciones),
    listarMisPostulaciones: crearListarMisPostulaciones(dependenciasPostulaciones),
    retirarPostulacion: crearRetirarPostulacion(dependenciasPostulaciones),
    listarPostulantes: crearListarPostulantes(dependenciasPostulaciones),
    decidirPostulacion: crearDecidirPostulacion(dependenciasPostulaciones)
  })
);

// Iniciar el servidor después de configurar las rutas.
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
