// Punto único de entrada para las pruebas: las mismas pruebas se ejecutan con Jest
// (`npm test`, con cobertura en `npm run test:cobertura`) o con el ejecutor nativo de
// Node (`npm run test:node`). Bajo Jest se usan sus funciones globales.
if (typeof jest !== "undefined") {
  const test = globalThis.test;
  test.describe = globalThis.describe;
  module.exports = test;
} else {
  module.exports = require("node:test");
}
