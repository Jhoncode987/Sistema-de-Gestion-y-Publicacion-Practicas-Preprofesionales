// Prueba de estrés: sube de forma progresiva hasta 2 000 usuarios virtuales
// concurrentes que consultan ofertas. NO es el escenario de aceptación (ese son
// 20 y 25 usuarios): sirve para ver dónde se degrada el sistema. Los umbrales
// no detienen la prueba; se informa lo que ocurre.
//   k6 run --summary-export=pruebas/k6/resultados/estres-2000.json pruebas/k6/estres-2000.js
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, cabeceras, estudiantes } from "./comun.js";

const MODALIDADES = ["presencial", "remota", "hibrida"];
const PICO = Number(__ENV.PICO || 2000);

export const options = {
  scenarios: {
    rampa: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: Math.round(PICO * 0.1) },
        { duration: "1m", target: Math.round(PICO * 0.25) },
        { duration: "1m", target: Math.round(PICO * 0.5) },
        { duration: "1m", target: Math.round(PICO * 0.75) },
        { duration: "1m", target: PICO },
        { duration: "2m", target: PICO },
        { duration: "1m", target: 0 }
      ],
      gracefulRampDown: "30s"
    }
  },
  thresholds: {
    http_req_duration: [{ threshold: "p(95)<2000", abortOnFail: false }],
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: false }]
  }
};

export default function () {
  const yo = estudiantes[(__VU - 1) % estudiantes.length];
  const modalidad = MODALIDADES[Math.floor(Math.random() * MODALIDADES.length)];
  const pagina = 1 + Math.floor(Math.random() * 10);

  const r = http.get(
    `${BASE}/api/v1/ofertas?modalidad=${modalidad}&carrera=${encodeURIComponent("Ingeniería de Sistemas")}&page=${pagina}&pageSize=20`,
    cabeceras(yo.token)
  );

  check(r, { "responde 200": (x) => x.status === 200 });
  sleep(2);
}
