const test = require("node:test");
const assert = require("node:assert/strict");

const { crearAutenticar, requerirRol } = require("./autenticacion.middleware.cjs");
const { crearManejadores } = require("./auth.routes.cjs");
const { crearServicioTokens } = require("../aplicacion/tokens.cjs");
const {
  DatosInvalidosError,
  CuentaDuplicadaError,
  CredencialesInvalidasError,
  DemasiadosIntentosError
} = require("../aplicacion/errores.cjs");

function respuestaFalsa() {
  return {
    estado: 200,
    cuerpo: undefined,
    status(n) { this.estado = n; return this; },
    json(c) { this.cuerpo = c; return this; }
  };
}

const tokens = crearServicioTokens({ secreto: "s".repeat(40) });

function peticion(cabecera, extra = {}) {
  return { get: (n) => (n === "Authorization" ? cabecera : undefined), ...extra };
}

test("autenticar exige un Bearer válido y rellena req.usuario", () => {
  const autenticar = crearAutenticar(tokens);
  const token = tokens.emitir({ id: "5", rol: "empresa" });

  for (const cabecera of [undefined, "", "Bearer", "Bearer abc", `Basic ${token}`, `bearer ${token}`]) {
    const res = respuestaFalsa();
    let siguio = false;
    autenticar(peticion(cabecera), res, () => { siguio = true; });
    assert.equal(siguio, false, String(cabecera));
    assert.equal(res.estado, 401);
    assert.equal(res.cuerpo.codigo, "NO_AUTENTICADO");
  }

  const req = peticion(`Bearer ${token}`);
  let siguio = false;
  autenticar(req, respuestaFalsa(), () => { siguio = true; });
  assert.equal(siguio, true);
  assert.deepEqual(req.usuario, { id: "5", rol: "empresa" });
});

test("requerirRol permite solo los roles indicados", () => {
  const guardia = requerirRol("coordinador");
  const res = respuestaFalsa();
  let siguio = false;

  guardia({ usuario: { id: "1", rol: "estudiante" } }, res, () => { siguio = true; });
  assert.equal(siguio, false);
  assert.equal(res.estado, 403);
  assert.equal(res.cuerpo.codigo, "ACCESO_DENEGADO");

  guardia({ usuario: { id: "1", rol: "coordinador" } }, respuestaFalsa(), () => { siguio = true; });
  assert.equal(siguio, true);

  const sinUsuario = respuestaFalsa();
  guardia({}, sinUsuario, () => assert.fail("no debe continuar"));
  assert.equal(sinUsuario.estado, 403);
});

test("los manejadores traducen cada error al código HTTP correcto", async () => {
  const casos = [
    [new DatosInvalidosError("x"), 400, "DATOS_INVALIDOS"],
    [new CuentaDuplicadaError(), 409, "CUENTA_DUPLICADA"],
    [new CredencialesInvalidasError(), 401, "CREDENCIALES_INVALIDAS"],
    [new DemasiadosIntentosError(), 429, "DEMASIADOS_INTENTOS"],
    [Object.assign(new Error("boom con datos internos"), { code: "ECONNREFUSED" }), 503, "SERVICIO_NO_DISPONIBLE"]
  ];

  const silencio = console.error;
  console.error = () => {};

  try {
    for (const [error, estado, codigo] of casos) {
      const falla = async () => { throw error; };
      const m = crearManejadores({ registrarUsuario: falla, iniciarSesion: falla, obtenerPerfil: falla });

      for (const [nombre, req] of [["registro", { body: {} }], ["login", { body: {} }], ["yo", { usuario: { id: "1" } }]]) {
        const res = respuestaFalsa();
        await m[nombre](req, res);
        assert.equal(res.estado, estado, nombre);
        assert.equal(res.cuerpo.codigo, codigo, nombre);
        assert.ok(!JSON.stringify(res.cuerpo).includes("internos"));
      }
    }
  } finally {
    console.error = silencio;
  }
});

test("registro responde 201, login 200 y yo devuelve el usuario", async () => {
  const m = crearManejadores({
    registrarUsuario: async () => ({ usuario: { id: "1" }, token: "t" }),
    iniciarSesion: async () => ({ usuario: { id: "1" }, token: "t" }),
    obtenerPerfil: async (id) => (id === "1" ? { id: "1", rol: "estudiante" } : null)
  });

  let res = respuestaFalsa();
  await m.registro({ body: {} }, res);
  assert.equal(res.estado, 201);

  res = respuestaFalsa();
  await m.login({ body: {} }, res);
  assert.equal(res.estado, 200);
  assert.equal(res.cuerpo.token, "t");

  res = respuestaFalsa();
  await m.yo({ usuario: { id: "1" } }, res);
  assert.deepEqual(res.cuerpo, { usuario: { id: "1", rol: "estudiante" } });

  res = respuestaFalsa();
  await m.yo({ usuario: { id: "2" } }, res);
  assert.equal(res.estado, 401);
});
