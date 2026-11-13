const {
  OfertaInvalidaError,
  AccesoDenegadoError,
  NoEncontradoError,
  TransicionInvalidaError
} = require("./errores.cjs");

const ACCIONES = {
  aprobar: { empresa: "aprobada", oferta: "publicada" },
  rechazar: { empresa: "rechazada", oferta: "rechazada" }
};

// Se consulta la base (no solo el token) para respetar cuentas desactivadas.
async function exigirCoordinador(obtenerPerfilUsuario, usuarioId) {
  const perfil = await obtenerPerfilUsuario(usuarioId);

  if (!perfil || perfil.rol !== "coordinador") {
    throw new AccesoDenegadoError("Solo la coordinación puede revisar empresas y ofertas");
  }

  return perfil;
}

function validarId(id) {
  if (!/^\d{1,18}$/.test(String(id))) {
    throw new NoEncontradoError();
  }

  return String(id);
}

function validarDecision(accion, motivo) {
  if (!(accion in ACCIONES)) {
    throw new OfertaInvalidaError("La acción debe ser aprobar o rechazar");
  }

  if (accion === "aprobar") {
    return null;
  }

  const texto = typeof motivo === "string" ? motivo.trim() : "";

  if (texto.length < 5 || texto.length > 500) {
    throw new OfertaInvalidaError(
      "Indica el motivo del rechazo (entre 5 y 500 caracteres)"
    );
  }

  return texto;
}

function crearListarPendientes({ ofertasRepository, obtenerPerfilUsuario }) {
  return async function listarPendientes(usuarioId) {
    await exigirCoordinador(obtenerPerfilUsuario, usuarioId);

    const [empresas, ofertas] = await Promise.all([
      ofertasRepository.listarEmpresasPorEstado("pendiente"),
      ofertasRepository.listarOfertasPorEstado("pendiente_revision")
    ]);

    return { empresas, ofertas };
  };
}

function crearDecidirEmpresa({ ofertasRepository, obtenerPerfilUsuario }) {
  return async function decidirEmpresa(usuarioId, id, accion, motivo) {
    const motivoValido = validarDecision(accion, motivo);
    const empresaId = validarId(id);
    const coordinador = await exigirCoordinador(obtenerPerfilUsuario, usuarioId);

    const actualizada = await ofertasRepository.decidirEmpresa({
      id: empresaId,
      estado: ACCIONES[accion].empresa,
      motivo: motivoValido,
      decididoPor: coordinador.id
    });

    if (actualizada) {
      return actualizada;
    }

    // No se actualizó nada: no existe o ya tenía una decisión.
    if (!(await ofertasRepository.obtenerEmpresa(empresaId))) {
      throw new NoEncontradoError("La empresa no existe");
    }

    throw new TransicionInvalidaError(
      "TRANSICION_INVALIDA",
      "La empresa ya fue revisada por la coordinación"
    );
  };
}

function crearDecidirOferta({ ofertasRepository, obtenerPerfilUsuario }) {
  return async function decidirOferta(usuarioId, id, accion, motivo) {
    const motivoValido = validarDecision(accion, motivo);
    const ofertaId = validarId(id);
    const coordinador = await exigirCoordinador(obtenerPerfilUsuario, usuarioId);

    const actualizada = await ofertasRepository.decidirOferta({
      id: ofertaId,
      estado: ACCIONES[accion].oferta,
      motivo: motivoValido,
      decididoPor: coordinador.id
    });

    if (actualizada) {
      return actualizada;
    }

    // Se explica por qué no se pudo, en orden de importancia.
    const oferta = await ofertasRepository.obtenerOfertaParaRevision(ofertaId);

    if (!oferta) {
      throw new NoEncontradoError("La oferta no existe");
    }

    if (oferta.estado !== "pendiente_revision") {
      throw new TransicionInvalidaError(
        "TRANSICION_INVALIDA",
        "La oferta ya fue revisada por la coordinación"
      );
    }

    if (oferta.empresaEstado !== "aprobada") {
      throw new TransicionInvalidaError(
        "EMPRESA_NO_APROBADA",
        "Aprueba primero a la empresa para poder publicar su oferta"
      );
    }

    throw new TransicionInvalidaError(
      "OFERTA_VENCIDA",
      "La fecha límite de la oferta ya pasó; solo se puede rechazar"
    );
  };
}

function crearCerrarOferta({ ofertasRepository, obtenerPerfilUsuario }) {
  return async function cerrarOferta(usuarioId, id, motivo) {
    const motivoValido = validarDecision("rechazar", motivo);
    const ofertaId = validarId(id);
    const coordinador = await exigirCoordinador(obtenerPerfilUsuario, usuarioId);

    const cerrada = await ofertasRepository.cerrarOfertaPorCoordinador({
      id: ofertaId,
      motivo: motivoValido,
      decididoPor: coordinador.id
    });

    if (cerrada) {
      return cerrada;
    }

    if (!(await ofertasRepository.obtenerOfertaParaRevision(ofertaId))) {
      throw new NoEncontradoError("La oferta no existe");
    }

    throw new TransicionInvalidaError(
      "TRANSICION_INVALIDA",
      "Solo se pueden cerrar ofertas publicadas; las pendientes se rechazan"
    );
  };
}

module.exports = {
  crearCerrarOferta,
  crearListarPendientes,
  crearDecidirEmpresa,
  crearDecidirOferta,
  validarDecision
};
