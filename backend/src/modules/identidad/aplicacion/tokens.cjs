const crypto = require("node:crypto");

// JWT HS256 mínimo, sin dependencias externas.
const DURACION_SEGUNDOS = 8 * 60 * 60;

function base64url(datos) {
  return Buffer.from(datos).toString("base64url");
}

function firmar(contenido, secreto) {
  return crypto.createHmac("sha256", secreto).update(contenido).digest("base64url");
}

function crearServicioTokens({ secreto, ahora = () => Date.now() }) {
  if (typeof secreto !== "string" || secreto.length < 32) {
    throw new Error("JWT_SECRET debe tener al menos 32 caracteres.");
  }

  function emitir({ id, rol }) {
    const emitido = Math.floor(ahora() / 1000);
    const cabecera = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const carga = base64url(
      JSON.stringify({
        sub: String(id),
        rol,
        iat: emitido,
        exp: emitido + DURACION_SEGUNDOS
      })
    );
    const cuerpo = `${cabecera}.${carga}`;

    return `${cuerpo}.${firmar(cuerpo, secreto)}`;
  }

  // Devuelve { id, rol } o null si el token no es válido o venció.
  function verificar(token) {
    if (typeof token !== "string") {
      return null;
    }

    const partes = token.split(".");

    if (partes.length !== 3) {
      return null;
    }

    const [cabecera, carga, firma] = partes;
    const esperada = Buffer.from(firmar(`${cabecera}.${carga}`, secreto));
    const recibida = Buffer.from(firma);

    if (
      esperada.length !== recibida.length ||
      !crypto.timingSafeEqual(esperada, recibida)
    ) {
      return null;
    }

    try {
      const encabezado = JSON.parse(Buffer.from(cabecera, "base64url"));
      const datos = JSON.parse(Buffer.from(carga, "base64url"));

      if (encabezado.alg !== "HS256") {
        return null;
      }

      if (!Number.isFinite(datos.exp) || datos.exp <= Math.floor(ahora() / 1000)) {
        return null;
      }

      return { id: datos.sub, rol: datos.rol };
    } catch {
      return null;
    }
  }

  return { emitir, verificar };
}

module.exports = { crearServicioTokens, DURACION_SEGUNDOS };
