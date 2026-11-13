const test = require("node:test");
const assert = require("node:assert/strict");

const { crearManejadores } = require("./coordinacion.manejadores.cjs");
const { OfertaInvalidaError, AccesoDenegadoError, NoEncontradoError, TransicionInvalidaError } = require("../aplicacion/errores.cjs");

function respuestaFalsa() {
  return {
    estado: 200, cuerpo: undefined,
    status(n) { this.estado = n; return this; },
    json(c) { this.cuerpo = c; return this; }
  };
}

test("las decisiones usan la acción de la ruta, el id de la URL y el coordinador del token", async () => {
  const llamadas = [];
  const m = crearManejadores({
    listarPendientes: async (id) => ({ empresas: [], ofertas: [], id }),
    decidirEmpresa: async (...a) => { llamadas.push(["empresa", ...a]); return { ok: true }; },
    decidirOferta: async (...a) => { llamadas.push(["oferta", ...a]); return { ok: true }; }
  });

  await m.empresa("rechazar")({ usuario: { id: "9" }, params: { id: "3" }, body: { motivo: "no cumple" } }, respuestaFalsa());
  await m.oferta("aprobar")({ usuario: { id: "9" }, params: { id: "4" }, body: undefined }, respuestaFalsa());

  assert.deepEqual(llamadas, [
    ["empresa", "9", "3", "rechazar", "no cumple"],
    ["oferta", "9", "4", "aprobar", undefined]
  ]);

  const res = respuestaFalsa();
  await m.pendientes({ usuario: { id: "9" } }, res);
  assert.equal(res.cuerpo.id, "9");
});

test("errores con su código HTTP: 400, 403, 404, 409 (con su código propio) y 503", async () => {
  const casos = [
    [new OfertaInvalidaError("x"), 400, "DATOS_INVALIDOS"],
    [new AccesoDenegadoError("x"), 403, "ACCESO_DENEGADO"],
    [new NoEncontradoError(), 404, "NO_ENCONTRADO"],
    [new TransicionInvalidaError("EMPRESA_NO_APROBADA", "x"), 409, "EMPRESA_NO_APROBADA"],
    [new TransicionInvalidaError("OFERTA_VENCIDA", "x"), 409, "OFERTA_VENCIDA"],
    [Object.assign(new Error("detalle interno"), { code: "ECONNREFUSED" }), 503, "SERVICIO_NO_DISPONIBLE"]
  ];
  const silencio = console.error;
  console.error = () => {};

  try {
    for (const [error, estado, codigo] of casos) {
      const falla = async () => { throw error; };
      const m = crearManejadores({ listarPendientes: falla, decidirEmpresa: falla, decidirOferta: falla });
      const req = { usuario: { id: "9" }, params: { id: "1" }, body: {} };

      for (const manejador of [m.pendientes, m.empresa("aprobar"), m.oferta("rechazar")]) {
        const res = respuestaFalsa();
        await manejador(req, res);
        assert.equal(res.estado, estado);
        assert.equal(res.cuerpo.codigo, codigo);
        assert.ok(!JSON.stringify(res.cuerpo).includes("interno"));
      }
    }
  } finally {
    console.error = silencio;
  }
});

test("cerrar usa el coordinador del token, el id de la URL y el motivo del cuerpo", async () => {
  let recibido;
  const m = crearManejadores({ cerrarOferta: async (...a) => { recibido = a; return { estado: "cerrada" }; } });
  const res = respuestaFalsa();

  await m.cerrar({ usuario: { id: "9" }, params: { id: "4" }, body: { motivo: "duplicada" } }, res);
  assert.deepEqual(recibido, ["9", "4", "duplicada"]);
  assert.equal(res.cuerpo.estado, "cerrada");
});
