const {
  AccesoDenegadoError,
  NoEncontradoError,
  DatosInvalidosError,
  ReglaDeNegocioError
} = require("./errores.cjs");
const { evaluarElegibilidad } = require("./elegibilidad.cjs");

const ID = /^\d{1,18}$/;
const MOTIVO_CUPO_LLENO = "Las vacantes de la oferta ya fueron cubiertas";

function validarId(valor, mensaje) {
  if (!ID.test(String(valor))) {
    throw new NoEncontradoError(mensaje);
  }

  return String(valor);
}

// Verifica el rol contra la base (no solo el token), igual que en Ofertas.
async function exigirRol(obtenerPerfilUsuario, usuarioId, rol) {
  const perfil = await obtenerPerfilUsuario(usuarioId);

  if (!perfil || perfil.rol !== rol) {
    throw new AccesoDenegadoError();
  }

  return perfil;
}

// `ofertas` es la fachada del módulo Ofertas (contratos, sin SQL cruzado):
//   obtenerOfertaParaPostular(id), obtenerOfertasPorIds(ids),
//   obtenerOfertaDeEmpresaUsuario(usuarioId, ofertaId), cerrarPorCupoLleno(id)
function crearPostular({ postulacionesRepository, obtenerPerfilUsuario, ofertas }) {
  return async function postular(usuarioId, entrada) {
    const ofertaId = validarId(entrada?.ofertaId, "La oferta no existe");
    const perfil = await exigirRol(obtenerPerfilUsuario, usuarioId, "estudiante");

    if (perfil.carrera == null || perfil.ciclo == null || perfil.creditosAprobados == null) {
      throw new ReglaDeNegocioError(
        "PERFIL_INCOMPLETO",
        "Completa tu perfil académico (carrera, ciclo y créditos) para postular"
      );
    }

    if (await postulacionesRepository.tieneAceptada(perfil.id)) {
      throw new ReglaDeNegocioError(
        "YA_TIENE_PRACTICA",
        "Ya fuiste aceptado en una práctica, no puedes postular a otras"
      );
    }

    const oferta = await ofertas.obtenerOfertaParaPostular(ofertaId);

    if (!oferta) {
      throw new NoEncontradoError("La oferta no existe");
    }

    if (!oferta.vigente) {
      throw new ReglaDeNegocioError("OFERTA_NO_VIGENTE", "La oferta ya no recibe postulaciones");
    }

    const motivos = evaluarElegibilidad(perfil, oferta);

    if (motivos.length > 0) {
      throw new ReglaDeNegocioError(
        "NO_ELEGIBLE",
        `No cumples los requisitos: ${motivos.join("; ")}`,
        motivos
      );
    }

    const creada = await postulacionesRepository.crear({ ofertaId, estudianteId: perfil.id });

    if (!creada) {
      throw new ReglaDeNegocioError("POSTULACION_DUPLICADA", "Ya postulaste a esta oferta");
    }

    return creada;
  };
}

function crearListarMisPostulaciones({ postulacionesRepository, obtenerPerfilUsuario, ofertas }) {
  return async function listarMisPostulaciones(usuarioId) {
    const perfil = await exigirRol(obtenerPerfilUsuario, usuarioId, "estudiante");
    const propias = await postulacionesRepository.listarPorEstudiante(perfil.id);
    const datos = await ofertas.obtenerOfertasPorIds([...new Set(propias.map((p) => p.ofertaId))]);
    const porId = new Map(datos.map((o) => [String(o.id), o]));

    return {
      items: propias.map((p) => ({ ...p, oferta: porId.get(String(p.ofertaId)) ?? null }))
    };
  };
}

function crearRetirarPostulacion({ postulacionesRepository, obtenerPerfilUsuario }) {
  return async function retirarPostulacion(usuarioId, id) {
    const postulacionId = validarId(id, "La postulación no existe");
    const perfil = await exigirRol(obtenerPerfilUsuario, usuarioId, "estudiante");
    const retirada = await postulacionesRepository.retirar({
      id: postulacionId,
      estudianteId: perfil.id
    });

    if (retirada) {
      return retirada;
    }

    // Ajena e inexistente responden igual.
    const existente = await postulacionesRepository.obtener(postulacionId);

    if (!existente || String(existente.estudianteId) !== String(perfil.id)) {
      throw new NoEncontradoError("La postulación no existe");
    }

    throw new ReglaDeNegocioError(
      "TRANSICION_INVALIDA",
      "Solo se puede retirar una postulación pendiente"
    );
  };
}

function crearListarPostulantes({ postulacionesRepository, obtenerPerfilUsuario, obtenerPerfiles, ofertas }) {
  return async function listarPostulantes(usuarioId, ofertaIdEntrada) {
    const ofertaId = validarId(ofertaIdEntrada, "La oferta no existe");
    const perfil = await exigirRol(obtenerPerfilUsuario, usuarioId, "empresa");
    const oferta = await ofertas.obtenerOfertaDeEmpresaUsuario(perfil.id, ofertaId);

    if (!oferta) {
      throw new NoEncontradoError("La oferta no existe");
    }

    const filas = await postulacionesRepository.listarPorOferta(ofertaId);
    const estudiantes = await obtenerPerfiles([...new Set(filas.map((f) => f.estudianteId))]);
    const porId = new Map(estudiantes.map((e) => [String(e.id), e]));

    return {
      oferta: { id: oferta.id, titulo: oferta.titulo, vacantes: oferta.vacantes, estado: oferta.estado },
      aceptadas: filas.filter((f) => ["aceptada", "finalizada"].includes(f.estado)).length,
      items: filas.map((f) => {
        const e = porId.get(String(f.estudianteId));

        return {
          ...f,
          estudiante: e
            ? {
                nombre: e.nombre,
                codigoEstudiante: e.codigoEstudiante,
                correo: e.correo,
                carrera: e.carrera,
                ciclo: e.ciclo,
                creditosAprobados: e.creditosAprobados
              }
            : null
        };
      })
    };
  };
}

// La empresa acepta o rechaza a un postulante de SU oferta.
function crearDecidirPostulacion({ postulacionesRepository, obtenerPerfilUsuario, ofertas }) {
  async function contexto(usuarioId, id) {
    const postulacionId = validarId(id, "La postulación no existe");
    const perfil = await exigirRol(obtenerPerfilUsuario, usuarioId, "empresa");
    const postulacion = await postulacionesRepository.obtener(postulacionId);

    // Una postulación de oferta ajena responde igual que una inexistente.
    const oferta = postulacion
      ? await ofertas.obtenerOfertaDeEmpresaUsuario(perfil.id, postulacion.ofertaId)
      : null;

    if (!postulacion || !oferta) {
      throw new NoEncontradoError("La postulación no existe");
    }

    return { postulacion, oferta };
  }

  const transicion = () =>
    new ReglaDeNegocioError("TRANSICION_INVALIDA", "Solo se puede decidir una postulación pendiente");

  return {
    async aceptar(usuarioId, id) {
      const { postulacion, oferta } = await contexto(usuarioId, id);

      if (oferta.estado !== "publicada") {
        throw new ReglaDeNegocioError("OFERTA_NO_VIGENTE", "La oferta ya no está publicada");
      }

      const resultado = await postulacionesRepository.aceptar({
        id: postulacion.id,
        ofertaId: postulacion.ofertaId,
        estudianteId: postulacion.estudianteId,
        vacantes: oferta.vacantes
      });

      if (resultado.resultado === "YA_ACEPTADO") {
        throw new ReglaDeNegocioError(
          "ESTUDIANTE_YA_ACEPTADO",
          "Este estudiante ya fue aceptado en otra práctica"
        );
      }

      if (resultado.resultado === "SIN_CUPO") {
        throw new ReglaDeNegocioError("SIN_CUPO", "Ya no quedan vacantes en esta oferta");
      }

      if (resultado.resultado === "TRANSICION") {
        throw transicion();
      }

      let ofertaCerrada = false;

      // Al cubrirse todas las vacantes la oferta se cierra sola y el resto de
      // pendientes queda rechazado, con motivo, para que nadie quede en espera.
      if (resultado.aceptadas >= oferta.vacantes) {
        await postulacionesRepository.rechazarPendientesDeOferta(postulacion.ofertaId, MOTIVO_CUPO_LLENO);
        ofertaCerrada = Boolean(await ofertas.cerrarPorCupoLleno(postulacion.ofertaId));
      }

      return {
        postulacion: resultado.postulacion,
        aceptadas: resultado.aceptadas,
        ofertaCerrada,
        postulacionesRetiradas: resultado.retiradas
      };
    },

    async rechazar(usuarioId, id, entrada) {
      const motivo = typeof entrada?.motivo === "string" ? entrada.motivo.trim() : "";

      if (motivo.length > 500) {
        throw new DatosInvalidosError("El motivo no puede superar 500 caracteres");
      }

      const { postulacion } = await contexto(usuarioId, id);
      const rechazada = await postulacionesRepository.rechazar({
        id: postulacion.id,
        motivo: motivo || null
      });

      if (!rechazada) {
        throw transicion();
      }

      return { postulacion: rechazada };
    }
  };
}

// La empresa dueña de la oferta (o la coordinación) marca la práctica como terminada.
function crearFinalizarPractica({ postulacionesRepository, obtenerPerfilUsuario, ofertas }) {
  return async function finalizarPractica(usuarioId, id) {
    const postulacionId = validarId(id, "La postulación no existe");
    const perfil = await obtenerPerfilUsuario(usuarioId);

    if (!perfil || !["empresa", "coordinador"].includes(perfil.rol)) {
      throw new AccesoDenegadoError();
    }

    const postulacion = await postulacionesRepository.obtener(postulacionId);

    // Una empresa solo ve las de sus ofertas; las ajenas responden "no existe".
    const permitido =
      postulacion &&
      (perfil.rol === "coordinador" ||
        Boolean(await ofertas.obtenerOfertaDeEmpresaUsuario(perfil.id, postulacion.ofertaId)));

    if (!permitido) {
      throw new NoEncontradoError("La postulación no existe");
    }

    const finalizada = await postulacionesRepository.finalizar(postulacion.id);

    if (!finalizada) {
      throw new ReglaDeNegocioError(
        "TRANSICION_INVALIDA",
        "Solo se puede finalizar una práctica aceptada"
      );
    }

    return { postulacion: finalizada };
  };
}

module.exports = {
  crearFinalizarPractica,
  crearPostular,
  crearListarMisPostulaciones,
  crearRetirarPostulacion,
  crearListarPostulantes,
  crearDecidirPostulacion,
  MOTIVO_CUPO_LLENO
};
