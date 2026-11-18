import { SharedArray } from "k6/data";

export const BASE = __ENV.BASE_URL || "http://localhost:3000";

// Tokens de los estudiantes sembrados (ver pruebas/README.md).
export const estudiantes = new SharedArray("estudiantes", () =>
  JSON.parse(open("./datos/tokens.json"))
);

export function cabeceras(token) {
  return { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };
}

// Protocolo del Sprint 1: 1 min de subida, 2 min de calentamiento y 10 min de
// medición estable. Solo la fase "medicion" cuenta para los umbrales.
// DURACION permite acortar la medición para pruebas rápidas (por ejemplo 30s).
export function escenariosProtocolo(funcion, usuarios) {
  const medicion = __ENV.DURACION || "10m";

  return {
    calentamiento: {
      executor: "ramping-vus",
      exec: funcion,
      startVUs: 0,
      stages: [
        { duration: "1m", target: usuarios },
        { duration: "2m", target: usuarios }
      ],
      tags: { fase: "calentamiento" },
      gracefulRampDown: "0s"
    },
    medicion: {
      executor: "constant-vus",
      exec: funcion,
      vus: usuarios,
      duration: medicion,
      startTime: "3m",
      tags: { fase: "medicion" }
    }
  };
}
