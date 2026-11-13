const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);

const N = 16384;
const LONGITUD = 64;

// Formato guardado: scrypt$N$sal$hash (sal y hash en base64).
async function hashearClave(clave) {
  const sal = crypto.randomBytes(16);
  const hash = await scrypt(clave, sal, LONGITUD, { N });

  return `scrypt$${N}$${sal.toString("base64")}$${hash.toString("base64")}`;
}

async function verificarClave(clave, guardado) {
  const partes = String(guardado).split("$");

  if (partes.length !== 4 || partes[0] !== "scrypt") {
    return false;
  }

  const costo = Number(partes[1]);
  const sal = Buffer.from(partes[2], "base64");
  const esperado = Buffer.from(partes[3], "base64");

  if (!Number.isInteger(costo) || costo < 1024 || esperado.length === 0) {
    return false;
  }

  const calculado = await scrypt(clave, sal, esperado.length, { N: costo });

  return crypto.timingSafeEqual(calculado, esperado);
}

module.exports = { hashearClave, verificarClave };
