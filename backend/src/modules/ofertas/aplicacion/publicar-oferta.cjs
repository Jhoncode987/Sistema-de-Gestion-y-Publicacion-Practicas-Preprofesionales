const {
  OfertaInvalidaError,
  AccesoDenegadoError,
  NoEncontradoError,
  TransicionInvalidaError
} = require("./errores.cjs");

const MODALIDADES = ["presencial", "remota", "hibrida"];
const CICLO_MAXIMO = 10;
const DIAS_MAXIMOS = 365;
const DESFASE_LIMA_MS = 5 * 60 * 60 * 1000; // UTC-5, sin horario de verano

function texto(valor, campo, min, max) {
  if (typeof valor !== "string") {
    throw new OfertaInvalidaError(`${campo} es obligatorio`);
  }

  const limpio = valor.trim();

  if (limpio.length < min || limpio.length > max) {
    throw new OfertaInvalidaError(
      `${campo} debe tener entre ${min} y ${max} caracteres`
    );
  }

  return limpio;
}

function entero(valor, campo, min, max) {
  const numero = typeof valor === "string" && valor.trim() !== "" ? Number(valor) : valor;

  if (!Number.isInteger(numero) || numero < min || numero > max) {
    throw new OfertaInvalidaError(`${campo} debe ser un número entero entre ${min} y ${max}`);
  }

  return numero;
}

// Fecha de hoy en Perú como "AAAA-MM-DD".
function hoyEnLima(ahora) {
  return new Date(ahora() - DESFASE_LIMA_MS).toISOString().slice(0, 10);
}

function validarFecha(valor, hoy) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new OfertaInvalidaError("La fecha límite debe tener el formato AAAA-MM-DD");
  }

  const fecha = new Date(`${valor}T00:00:00Z`);

  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) {
    throw new OfertaInvalidaError("La fecha límite no es válida");
  }

  if (valor <= hoy) {
    throw new OfertaInvalidaError("La fecha límite debe ser posterior a hoy");
  }

  const limite = new Date(`${hoy}T00:00:00Z`).getTime() + DIAS_MAXIMOS * 86400000;

  if (fecha.getTime() > limite) {
    throw new OfertaInvalidaError(
      `La fecha límite no puede superar los ${DIAS_MAXIMOS} días desde hoy`
    );
  }

  return valor;
}

function validarOferta(entrada, hoy) {
  if (entrada === null || typeof entrada !== "object") {
    throw new OfertaInvalidaError("Solicitud inválida");
  }

  const modalidad =
    typeof entrada.modalidad === "string" ? entrada.modalidad.trim().toLowerCase() : "";

  if (!MODALIDADES.includes(modalidad)) {
    throw new OfertaInvalidaError("La modalidad debe ser presencial, remota o hibrida");
  }

  return {
    titulo: texto(entrada.titulo, "El título", 5, 200).replace(/\s+/g, " "),
    descripcion: texto(entrada.descripcion, "La descripción", 20, 2000),
    carrera: texto(entrada.carrera, "La carrera", 3, 150).replace(/\s+/g, " "),
    ciclo_minimo: entero(entrada.ciclo_minimo, "El ciclo mínimo", 1, CICLO_MAXIMO),
    creditos_minimos: entero(entrada.creditos_minimos ?? 0, "Los créditos mínimos", 0, 250),
    modalidad,
    vacantes: entero(entrada.vacantes, "Las vacantes", 1, 100),
    fecha_limite: validarFecha(entrada.fecha_limite, hoy)
  };
}

// Devuelve la empresa del usuario o falla si la cuenta no es de empresa.
// Se consulta la base (no solo el token) para respetar cuentas desactivadas.
async function empresaDelUsuario({ ofertasRepository, obtenerPerfilUsuario }, usuarioId) {
  const perfil = await obtenerPerfilUsuario(usuarioId);

  if (!perfil || perfil.rol !== "empresa") {
    throw new AccesoDenegadoError();
  }

  return ofertasRepository.obtenerOCrearEmpresa({
    usuarioId: perfil.id,
    ruc: perfil.ruc,
    razonSocial: perfil.razonSocial
  });
}

function crearPublicarOferta({ ofertasRepository, obtenerPerfilUsuario, ahora = () => Date.now() }) {
  return async function publicarOferta(usuarioId, entrada) {
    // Se valida primero: no se crea la empresa si los datos están mal.
    const datos = validarOferta(entrada, hoyEnLima(ahora));
    const empresa = await empresaDelUsuario(
      { ofertasRepository, obtenerPerfilUsuario },
      usuarioId
    );

    // Toda oferta nueva queda pendiente de revisión por la coordinación (RF01).
    return ofertasRepository.crearOferta({ empresaId: empresa.id, ...datos });
  };
}

function crearListarMisOfertas({ ofertasRepository, obtenerPerfilUsuario }) {
  return async function listarMisOfertas(usuarioId) {
    const empresa = await empresaDelUsuario(
      { ofertasRepository, obtenerPerfilUsuario },
      usuarioId
    );

    return {
      empresa: {
        razonSocial: empresa.razonSocial,
        ruc: empresa.ruc,
        estado: empresa.estado,
        motivoRechazo: empresa.motivoRechazo ?? null
      },
      items: await ofertasRepository.listarPorEmpresa(empresa.id)
    };
  };
}

function crearCerrarMiOferta({ ofertasRepository, obtenerPerfilUsuario }) {
  return async function cerrarMiOferta(usuarioId, id) {
    if (!/^\d{1,18}$/.test(String(id))) {
      throw new NoEncontradoError("La oferta no existe");
    }

    const empresa = await empresaDelUsuario(
      { ofertasRepository, obtenerPerfilUsuario },
      usuarioId
    );
    const cerrada = await ofertasRepository.cerrarOfertaDeEmpresa({
      id: String(id),
      empresaId: empresa.id
    });

    if (cerrada) {
      return cerrada;
    }

    // Una oferta ajena responde igual que una inexistente: no revela su existencia.
    if (!(await ofertasRepository.obtenerOfertaDeEmpresa(String(id), empresa.id))) {
      throw new NoEncontradoError("La oferta no existe");
    }

    throw new TransicionInvalidaError(
      "TRANSICION_INVALIDA",
      "Solo se pueden cerrar ofertas en revisión o publicadas"
    );
  };
}

module.exports = {
  crearPublicarOferta,
  crearListarMisOfertas,
  crearCerrarMiOferta,
  validarOferta,
  hoyEnLima
};
