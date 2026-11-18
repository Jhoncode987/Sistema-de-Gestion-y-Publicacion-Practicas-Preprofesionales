const { AccesoDenegadoError, DatosInvalidosError, NoEncontradoError } = require("./errores.cjs");

const TAMANO_MAXIMO = 2 * 1024 * 1024;
const TAMANO_PAGINA = 20;
const FILTROS = ["pendientes", "verificados", "todos"];
const ID = /^\d{1,18}$/;

// El rol se comprueba contra la base, no solo contra el token.
async function exigirRol(usuariosRepository, usuarioId, rol) {
  const usuario = await usuariosRepository.buscarPorId(usuarioId);

  if (!usuario || !usuario.activo || usuario.rol !== rol) {
    throw new AccesoDenegadoError();
  }

  return usuario;
}

function validarId(valor) {
  if (!ID.test(String(valor))) {
    throw new NoEncontradoError("El estudiante no existe");
  }

  return String(valor);
}

// El estudiante sube su reporte de notas (PDF) para que la coordinación verifique sus créditos.
function crearSubirReporteNotas({ usuariosRepository }) {
  return async function subirReporteNotas(usuarioId, contenido) {
    const estudiante = await exigirRol(usuariosRepository, usuarioId, "estudiante");

    if (!Buffer.isBuffer(contenido) || contenido.length === 0) {
      throw new DatosInvalidosError("Adjunta tu reporte de notas en formato PDF");
    }

    if (contenido.length > TAMANO_MAXIMO) {
      throw new DatosInvalidosError("El archivo no puede superar 2 MB");
    }

    if (contenido.subarray(0, 5).toString("latin1") !== "%PDF-") {
      throw new DatosInvalidosError("El archivo debe ser un PDF");
    }

    await usuariosRepository.guardarReporte(estudiante.id, contenido);

    return { subido: true };
  };
}

function crearListarEstudiantes({ usuariosRepository }) {
  return async function listarEstudiantes(coordinadorId, consulta = {}) {
    await exigirRol(usuariosRepository, coordinadorId, "coordinador");

    const estado = consulta.estado === undefined || consulta.estado === "" ? "pendientes" : consulta.estado;

    if (!FILTROS.includes(estado)) {
      throw new DatosInvalidosError("El filtro indicado no es válido");
    }

    const pagina = consulta.page === undefined ? 1 : Number(consulta.page);

    if (!Number.isInteger(pagina) || pagina < 1 || pagina > 10000) {
      throw new DatosInvalidosError("La página debe ser un entero positivo");
    }

    const { items, total } = await usuariosRepository.listarEstudiantes({
      estado,
      limite: TAMANO_PAGINA,
      desplazamiento: (pagina - 1) * TAMANO_PAGINA
    });

    return {
      total,
      page: pagina,
      pageSize: TAMANO_PAGINA,
      items: items.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        codigoEstudiante: e.codigoEstudiante,
        correo: e.correo,
        carrera: e.carrera,
        ciclo: e.ciclo,
        creditosAprobados: e.creditosAprobados,
        creditosVerificados: e.creditosVerificados,
        creditosVerificadosEn: e.creditosVerificadosEn,
        tieneReporte: e.tieneReporte
      }))
    };
  };
}

function crearObtenerReporteNotas({ usuariosRepository }) {
  return async function obtenerReporteNotas(coordinadorId, estudianteId) {
    await exigirRol(usuariosRepository, coordinadorId, "coordinador");

    const contenido = await usuariosRepository.obtenerReporte(validarId(estudianteId));

    if (!contenido) {
      throw new NoEncontradoError("El estudiante no ha subido su reporte de notas");
    }

    return contenido;
  };
}

// La coordinación revisa el reporte, suma los créditos y registra el total.
function crearVerificarCreditos({ usuariosRepository }) {
  return async function verificarCreditos(coordinadorId, estudianteId, entrada) {
    const coordinador = await exigirRol(usuariosRepository, coordinadorId, "coordinador");
    const id = validarId(estudianteId);
    const creditos = entrada?.creditos;

    if (!Number.isInteger(creditos) || creditos < 0 || creditos > 250) {
      throw new DatosInvalidosError("Los créditos deben ser un número entero entre 0 y 250");
    }

    const actualizado = await usuariosRepository.verificarCreditos({
      id,
      creditos,
      coordinadorId: coordinador.id
    });

    if (!actualizado) {
      throw new NoEncontradoError("El estudiante no existe o aún no subió su reporte de notas");
    }

    return { estudiante: actualizado };
  };
}

module.exports = {
  crearSubirReporteNotas,
  crearListarEstudiantes,
  crearObtenerReporteNotas,
  crearVerificarCreditos
};
