// La fecha límite es un DATE de PostgreSQL: llega como medianoche UTC,
// por eso se formatea en UTC para no mostrar un día menos.
export function formatearFecha(valor) {
  const fecha = new Date(valor);

  return Number.isNaN(fecha.getTime())
    ? "Fecha no disponible"
    : fecha.toLocaleDateString("es-PE", { timeZone: "UTC" });
}

export const MODALIDADES = [
  { valor: "presencial", etiqueta: "Presencial" },
  { valor: "remota", etiqueta: "Remota" },
  { valor: "hibrida", etiqueta: "Híbrida" }
];

export const CICLOS = Array.from({ length: 10 }, (_, i) => i + 1);
