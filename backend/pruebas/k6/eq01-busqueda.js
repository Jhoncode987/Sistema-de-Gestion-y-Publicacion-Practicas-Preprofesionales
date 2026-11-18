// EQ-01 (AC01 Rendimiento: búsqueda). Uso:
//   k6 run -e USUARIOS=20 --summary-export=pruebas/k6/resultados/eq01-20.json pruebas/k6/eq01-busqueda.js
//   k6 run -e USUARIOS=25 ...
// Objetivo en la fase estable: p95 <= 2 s, fallos < 1 % y cero ofertas no publicadas
// ni de otra carrera cuando se filtra por carrera.
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";
import { BASE, cabeceras, estudiantes, escenariosProtocolo } from "./comun.js";

const USUARIOS = Number(__ENV.USUARIOS || 20);
const MODALIDADES = ["presencial", "remota", "hibrida"];
const ofertasIncorrectas = new Counter("ofertas_incorrectas");

export const options = {
  scenarios: escenariosProtocolo("buscar", USUARIOS),
  thresholds: {
    "http_req_duration{fase:medicion}": ["p(95)<2000"],
    "http_req_failed{fase:medicion}": ["rate<0.01"],
    "checks{fase:medicion}": ["rate>0.99"],
    ofertas_incorrectas: ["count==0"]
  }
};

export function buscar() {
  const yo = estudiantes[(__VU - 1) % estudiantes.length];
  const modalidad = MODALIDADES[Math.floor(Math.random() * MODALIDADES.length)];
  const pagina = 1 + Math.floor(Math.random() * 10);
  const ruta = `${BASE}/api/v1/ofertas?modalidad=${modalidad}&carrera=${encodeURIComponent("Ingeniería de Sistemas")}&page=${pagina}&pageSize=20`;

  const r = http.get(ruta, cabeceras(yo.token));
  let cuerpo = null;

  try {
    cuerpo = r.json();
  } catch (e) {
    cuerpo = null;
  }

  const ok = check(r, {
    "responde 200": (x) => x.status === 200,
    "trae la lista": () => cuerpo !== null && Array.isArray(cuerpo.items)
  });

  if (ok && cuerpo) {
    for (const o of cuerpo.items) {
      if (o.estado !== "publicada" || o.modalidad !== modalidad || o.carrera !== "Ingeniería de Sistemas") {
        ofertasIncorrectas.add(1);
      }
    }
  }

  sleep(2); // 2 segundos entre operaciones, según el protocolo
}
