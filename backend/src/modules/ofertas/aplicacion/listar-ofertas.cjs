const MODALIDADES = ["presencial", "remota", "hibrida"];
const TAMANO_PAGINA_PREDETERMINADO = 9;
const TAMANO_PAGINA_MAXIMO = 50;
const CICLO_MAXIMO = 10;

class ConsultaInvalidaError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ConsultaInvalidaError";
  }
}

function leerTexto(valor, nombre, maximo) {
  if (valor === undefined) {
    return undefined;
  }

  if (typeof valor !== "string") {
    throw new ConsultaInvalidaError(`El parámetro ${nombre} no es válido.`);
  }

  const texto = valor.trim();

  if (texto === "") {
    return undefined;
  }

  if (texto.length > maximo) {
    throw new ConsultaInvalidaError(
      `El parámetro ${nombre} es demasiado largo.`
    );
  }

  return texto;
}

function leerEntero(valor, nombre, minimo, maximo) {
  const texto = leerTexto(valor, nombre, 10);

  if (texto === undefined) {
    return undefined;
  }

  const numero = Number(texto);

  if (!/^\d+$/.test(texto) || numero < minimo || numero > maximo) {
    throw new ConsultaInvalidaError(
      `El parámetro ${nombre} debe ser un número entre ${minimo} y ${maximo}.`
    );
  }

  return numero;
}

// Valida los parámetros de la URL y completa los valores por defecto.
function normalizarConsulta(entrada = {}) {
  const modalidad = leerTexto(entrada.modalidad, "modalidad", 20)?.toLowerCase();

  if (modalidad !== undefined && !MODALIDADES.includes(modalidad)) {
    throw new ConsultaInvalidaError(
      `El parámetro modalidad debe ser: ${MODALIDADES.join(", ")}.`
    );
  }

  return {
    q: leerTexto(entrada.q, "q", 100),
    modalidad,
    carrera: leerTexto(entrada.carrera, "carrera", 150),
    ciclo: leerEntero(entrada.ciclo, "ciclo", 1, CICLO_MAXIMO),
    page: leerEntero(entrada.page, "page", 1, 100000) ?? 1,
    pageSize:
      leerEntero(entrada.pageSize, "pageSize", 1, TAMANO_PAGINA_MAXIMO) ??
      TAMANO_PAGINA_PREDETERMINADO
  };
}

function crearListarOfertas(ofertasRepository) {
  return async function listarOfertas(entrada) {
    const consulta = normalizarConsulta(entrada);
    const { items, total } = await ofertasRepository.listarPublicadas(consulta);

    return {
      items,
      page: consulta.page,
      pageSize: consulta.pageSize,
      total
    };
  };
}

module.exports = {
  crearListarOfertas,
  normalizarConsulta,
  ConsultaInvalidaError,
  MODALIDADES
};
