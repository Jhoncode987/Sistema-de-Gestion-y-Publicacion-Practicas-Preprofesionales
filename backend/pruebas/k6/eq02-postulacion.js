// EQ-02 (AC01 Rendimiento: postulación). Uso:
//   k6 run -e USUARIOS=20 --summary-export=pruebas/k6/resultados/eq02-20.json pruebas/k6/eq02-postulacion.js
// Cada usuario virtual usa su propio estudiante y combinaciones estudiante-oferta
// distintas y válidas (ofertas de Ingeniería de Sistemas). Objetivo: p95 <= 3 s y
// fallos < 1 % (solo cuenta 201; cualquier otra respuesta es fallo).
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, cabeceras, estudiantes, escenariosProtocolo } from "./comun.js";

const USUARIOS = Number(__ENV.USUARIOS || 20);
let inesperadas = 0;

export const options = {
  scenarios: escenariosProtocolo("postular", USUARIOS),
  thresholds: {
    "http_req_duration{fase:medicion}": ["p(95)<3000"],
    "http_req_failed{fase:medicion}": ["rate<0.01"],
    "checks{fase:medicion}": ["rate>0.99"]
  }
};

// Ids de ofertas compatibles, obtenidos una vez antes de empezar.
export function setup() {
  const ids = [];

  for (let pagina = 1; pagina <= 20; pagina++) {
    const r = http.get(
      `${BASE}/api/v1/ofertas?carrera=${encodeURIComponent("Ingeniería de Sistemas")}&page=${pagina}&pageSize=50`,
      cabeceras(estudiantes[0].token)
    );

    if (r.status !== 200) break;
    for (const o of r.json().items) ids.push(o.id);
  }

  if (ids.length < 500) {
    throw new Error(`Se esperaban 500+ ofertas compatibles y llegaron ${ids.length}. ¿Se cargó la semilla?`);
  }

  return { ids };
}

export function postular(datos) {
  const yo = estudiantes[(__VU - 1) % estudiantes.length];
  // Cada iteración del mismo usuario avanza a otra oferta: nunca repite pareja.
  const oferta = datos.ids[(__VU * 7 + __ITER) % datos.ids.length];

  const r = http.post(
    `${BASE}/api/v1/postulaciones`,
    JSON.stringify({ ofertaId: String(oferta) }),
    cabeceras(yo.token)
  );

  // Diagnóstico: muestra el código y el cuerpo de las primeras respuestas que no son 201.
  if (r.status !== 201 && ++inesperadas <= 5) {
    console.warn(`Respuesta ${r.status} (estudiante ${yo.id}, oferta ${oferta}): ${String(r.body).slice(0, 200)}`);
  }

  check(r, { "responde 201": (x) => x.status === 201 });
  sleep(2);
}
