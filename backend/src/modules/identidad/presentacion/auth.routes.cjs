const express = require("express");

const {
  DatosInvalidosError,
  CuentaDuplicadaError,
  CredencialesInvalidasError,
  DemasiadosIntentosError,
  AccesoDenegadoError
} = require("../aplicacion/errores.cjs");

function responderError(res, error, contexto) {
  const conocidos = [
    [DatosInvalidosError, 400, "DATOS_INVALIDOS"],
    [CuentaDuplicadaError, 409, "CUENTA_DUPLICADA"],
    [CredencialesInvalidasError, 401, "CREDENCIALES_INVALIDAS"],
    [DemasiadosIntentosError, 429, "DEMASIADOS_INTENTOS"],
    [AccesoDenegadoError, 403, "ACCESO_DENEGADO"]
  ];

  for (const [Clase, estado, codigo] of conocidos) {
    if (error instanceof Clase) {
      return res.status(estado).json({ codigo, mensaje: error.message });
    }
  }

  console.error(`Error al ${contexto}:`, error.code ?? error.name);

  return res.status(503).json({
    codigo: "SERVICIO_NO_DISPONIBLE",
    mensaje: "No se pudo completar la solicitud"
  });
}

// Manejadores puros (req, res): se pueden probar sin levantar Express.
function crearManejadores({
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
  actualizarPerfilAcademico
}) {
  return {
    async registro(req, res) {
      try {
        res.status(201).json(await registrarUsuario(req.body));
      } catch (error) {
        responderError(res, error, "registrar usuario");
      }
    },

    async login(req, res) {
      try {
        res.json(await iniciarSesion(req.body));
      } catch (error) {
        responderError(res, error, "iniciar sesión");
      }
    },

    async perfilAcademico(req, res) {
      try {
        res.json({
          usuario: await actualizarPerfilAcademico(req.usuario.id, req.body)
        });
      } catch (error) {
        responderError(res, error, "actualizar perfil académico");
      }
    },

    async yo(req, res) {
      try {
        const usuario = await obtenerPerfil(req.usuario.id);

        if (!usuario) {
          return res.status(401).json({
            codigo: "NO_AUTENTICADO",
            mensaje: "Debes iniciar sesión"
          });
        }

        res.json({ usuario });
      } catch (error) {
        responderError(res, error, "obtener perfil");
      }
    }
  };
}

function crearAuthRouter({ autenticar, ...casosDeUso }) {
  const router = express.Router();
  const manejadores = crearManejadores(casosDeUso);

  router.post("/registro", manejadores.registro);
  router.post("/login", manejadores.login);
  router.get("/yo", autenticar, manejadores.yo);
  router.put("/perfil-academico", autenticar, manejadores.perfilAcademico);

  return router;
}

module.exports = { crearAuthRouter, crearManejadores };
