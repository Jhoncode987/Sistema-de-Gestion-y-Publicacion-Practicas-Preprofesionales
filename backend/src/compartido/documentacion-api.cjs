const fs = require("node:fs");
const path = require("node:path");

const VERSION_SWAGGER_UI = "5";

// Página de Swagger UI. Carga la interfaz desde un CDN para no añadir dependencias
// al backend; la especificación se sirve desde el propio servidor.
const PAGINA = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>API de Prácticas Preprofesionales UNSCH</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@${VERSION_SWAGGER_UI}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${VERSION_SWAGGER_UI}/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: "openapi.yaml", dom_id: "#swagger-ui" });
    </script>
  </body>
</html>
`;

// Manejadores puros (req, res) de la documentación OpenAPI de la API.
function crearDocumentacionApi({ archivo = path.join(__dirname, "..", "..", "openapi.yaml") } = {}) {
  const especificacion = fs.readFileSync(archivo, "utf8");

  return {
    pagina(req, res) {
      res.set("Content-Type", "text/html; charset=utf-8");
      res.send(PAGINA);
    },

    especificacion(req, res) {
      res.set("Content-Type", "application/yaml; charset=utf-8");
      res.send(especificacion);
    }
  };
}

module.exports = { crearDocumentacionApi };
