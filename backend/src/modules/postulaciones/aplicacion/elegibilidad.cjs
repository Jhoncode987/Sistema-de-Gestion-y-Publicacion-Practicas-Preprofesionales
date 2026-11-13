// Normaliza para comparar carreras: sin tildes, mayúsculas ni espacios de más.
function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Devuelve la lista de motivos por los que el estudiante NO puede postular
// (vacía = elegible). Los datos académicos son declarados por el estudiante
// hasta que exista la integración con SIGA.
function evaluarElegibilidad(perfil, oferta) {
  const motivos = [];

  if (normalizar(perfil.carrera) !== normalizar(oferta.carrera)) {
    motivos.push(`La oferta es para la carrera de ${oferta.carrera}`);
  }

  if (perfil.ciclo < oferta.ciclo_minimo) {
    motivos.push(`Requiere estar en el ciclo ${oferta.ciclo_minimo} o superior (estás en el ${perfil.ciclo})`);
  }

  if (perfil.creditosAprobados < oferta.creditos_minimos) {
    motivos.push(
      `Requiere ${oferta.creditos_minimos} créditos aprobados (tienes ${perfil.creditosAprobados})`
    );
  }

  return motivos;
}

module.exports = { evaluarElegibilidad, normalizar };
