// EQ-02, ráfaga: 25 solicitudes simultáneas de UNA misma cuenta a UNA misma oferta.
// Esperado: exactamente 1 respuesta 201, 24 respuestas 409 y ningún 5xx.
//   k6 run --summary-export=pruebas/k6/resultados/eq02-rafaga.json pruebas/k6/eq02-rafaga.js
// Para repetirla hay que borrar la fila (ver pruebas/README.md) o cambiar OFERTA_ID.
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";
import { BASE, cabeceras, estudiantes } from "./comun.js";

const OFERTA_ID = __ENV.OFERTA_ID || "1";
const c201 = new Counter("respuestas_201");
const c409 = new Counter("respuestas_409");
const c5xx = new Counter("respuestas_5xx");

export const options = {
  scenarios: {
    rafaga: { executor: "shared-iterations", vus: 25, iterations: 25, maxDuration: "1m" }
  },
  thresholds: {
    respuestas_201: ["count==1"],
    respuestas_409: ["count==24"],
    respuestas_5xx: ["count==0"]
  }
};

export default function () {
  // Siempre el último estudiante de la semilla, que no usan las otras pruebas.
  const yo = estudiantes[estudiantes.length - 1];
  const r = http.post(
    `${BASE}/api/v1/postulaciones`,
    JSON.stringify({ ofertaId: OFERTA_ID }),
    cabeceras(yo.token)
  );

  if (r.status === 201) c201.add(1);
  else if (r.status === 409) c409.add(1);
  else if (r.status >= 500) c5xx.add(1);

  check(r, { "201 o 409": (x) => x.status === 201 || x.status === 409 });
}
