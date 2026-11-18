const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { crearDocumentacionApi } = require("./documentacion-api.cjs");

function respuesta() {
  return {
    cabeceras: {},
    cuerpo: undefined,
    set(nombre, valor) { this.cabeceras[nombre] = valor; },
    send(cuerpo) { this.cuerpo = cuerpo; }
  };
}

test("sirve la página de Swagger UI apuntando a la especificación local", () => {
  const r = respuesta();
  crearDocumentacionApi().pagina({}, r);
  assert.match(r.cabeceras["Content-Type"], /text\/html/);
  assert.match(r.cuerpo, /swagger-ui/);
  assert.match(r.cuerpo, /url: "openapi\.yaml"/);
});

test("sirve la especificación OpenAPI 3", () => {
  const r = respuesta();
  crearDocumentacionApi().especificacion({}, r);
  assert.match(r.cabeceras["Content-Type"], /yaml/);
  assert.match(r.cuerpo, /^openapi: 3\.0\.3/);
});

// Contrato: toda ruta con router.get/post/put del backend debe estar en openapi.yaml.
test("openapi.yaml documenta todas las rutas implementadas", () => {
  const raiz = path.join(__dirname, "..", "..");
  const yaml = fs.readFileSync(path.join(raiz, "openapi.yaml"), "utf8");
  const documentadas = new Set(
    [...yaml.matchAll(/^  (\/[^\s:]*):\s*$/gm)].map((m) => m[1].replace(/\{[^}]+\}/g, ":p"))
  );

  const montajes = {
    "ofertas.routes.cjs": "/ofertas",
    "coordinacion.routes.cjs": "/coordinacion",
    "postulaciones.routes.cjs": "/postulaciones",
    "auth.routes.cjs": "/auth"
  };
  const faltan = [];

  for (const [archivo, base] of Object.entries(montajes)) {
    const carpeta = fs.readdirSync(path.join(raiz, "src", "modules"))
      .map((m) => path.join(raiz, "src", "modules", m, "presentacion", archivo))
      .find((ruta) => fs.existsSync(ruta));
    const codigo = fs.readFileSync(carpeta, "utf8");

    for (const m of codigo.matchAll(/router\.(?:get|post|put)\(\s*"([^"]*)"/g)) {
      const ruta = (base + (m[1] === "/" ? "" : m[1])).replace(/:[A-Za-z]+/g, ":p");
      if (!documentadas.has(ruta)) faltan.push(ruta);
    }
  }

  assert.deepEqual(faltan, []);
});
