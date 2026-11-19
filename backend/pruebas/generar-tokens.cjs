// Genera tokens de sesión para los estudiantes de la semilla, sin pasar por el
// login (evita 2 000 cálculos de hash de contraseña antes de la prueba).
// Uso: node pruebas/generar-tokens.cjs   (lee pruebas/k6/datos/ids-estudiantes.txt)
// Requiere el mismo JWT_SECRET con el que se inicia el backend (backend/.env).
const fs = require("node:fs");
const path = require("node:path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { crearServicioTokens } = require("../src/modules/identidad/aplicacion/tokens.cjs");

const entrada = path.join(__dirname, "k6", "datos", "ids-estudiantes.txt");
const salida = path.join(__dirname, "k6", "datos", "tokens.json");

if (!fs.existsSync(entrada)) {
  console.error("Falta pruebas/k6/datos/ids-estudiantes.txt (ver pruebas/README.md, paso 3).");
  process.exit(1);
}

const tokens = crearServicioTokens({ secreto: process.env.JWT_SECRET });
const ids = fs.readFileSync(entrada, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

if (ids.length === 0 || ids.some((id) => !/^\d+$/.test(id))) {
  console.error("El archivo de ids debe tener un id numérico por línea.");
  process.exit(1);
}

fs.writeFileSync(
  salida,
  JSON.stringify(ids.map((id) => ({ id, token: tokens.emitir({ id, rol: "estudiante" }) })))
);

console.log(`${ids.length} tokens escritos en ${path.relative(process.cwd(), salida)} (válidos 8 horas).`);
