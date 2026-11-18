const express = require("express");

const {
  DatosInvalidosError,
  CuentaDuplicadaError,
  CredencialesInvalidasError,
  DemasiadosIntentosError,
  AccesoDenegadoError,
  NoEncontradoError
} = require("../aplicacion/errores.cjs");

function responderError(res, error, contexto) {
  const conocidos = [
    [DatosInvalidosError, 400, "DATOS_INVALIDOS"],
    [CuentaDuplicadaError, 409, "CUENTA_DUPLICADA"],
    [CredencialesInvalidasError, 401, "CREDENCIALES_INVALIDAS"],
    [DemasiadosIntentosError, 429, "DEMASIADOS_INTENTOS"],
    [AccesoDenegadoError, 403, "ACCESO_DENEGADO"],
    [NoEncontradoError, 404, "NO_ENCONTRADO"]
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
  actualizarPerfilAcademico,
  subirReporteNotas,
  listarEstudiantes,
  obtenerReporteNotas,
  verificarCreditos
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

    // El cuerpo llega como PDF binario (Buffer); sin PDF, req.body no es un Buffer.
    async subirReporte(req, res) {
      try {
        res.json(await subirReporteNotas(req.usuario.id, req.body));
      } catch (error) {
        responderError(res, error, "subir reporte de notas");
      }
    },

    async estudiantes(req, res) {
      try {
        res.json(await listarEstudiantes(req.usuario.id, req.query));
      } catch (error) {
        responderError(res, error, "listar estudiantes");
      }
    },

    async reporte(req, res) {
      try {
        const pdf = await obtenerReporteNotas(req.usuario.id, req.params.id);

        res.set("Content-Type", "application/pdf");
        res.set("Content-Disposition", 'inline; filename="reporte-notas.pdf"');
        res.set("Cache-Control", "no-store");
        res.send(pdf);
      } catch (error) {
        responderError(res, error, "obtener reporte de notas");
      }
    },

    async verificacion(req, res) {
      try {
        res.json(await verificarCreditos(req.usuario.id, req.params.id, req.body));
      } catch (error) {
        responderError(res, error, "verificar créditos");
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

function crearAuthRouter({ autenticar, soloEstudiante, soloCoordinador, ...casosDeUso }) {
  const router = express.Router();
  const manejadores = crearManejadores(casosDeUso);

  router.post("/registro", manejadores.registro);
  router.post("/login", manejadores.login);
  router.get("/yo", autenticar, manejadores.yo);
  router.put("/perfil-academico", autenticar, manejadores.perfilAcademico);

  router.put(
    "/reporte-notas",
    autenticar,
    soloEstudiante,
    express.raw({ type: "application/pdf", limit: "2mb" }),
    manejadores.subirReporte
  );
  router.get("/estudiantes", autenticar, soloCoordinador, manejadores.estudiantes);
  router.get("/estudiantes/:id/reporte", autenticar, soloCoordinador, manejadores.reporte);
  router.put("/estudiantes/:id/verificacion", autenticar, soloCoordinador, manejadores.verificacion);

  return router;
}

module.exports = { crearAuthRouter, crearManejadores };
