const test = require("node:test");
const assert = require("node:assert/strict");

const { crearManejadores } = require("./ofertas.manejadores.cjs");
const { ConsultaInvalidaError } = require("../aplicacion/listar-ofertas.cjs");
const { OfertaInvalidaError, AccesoDenegadoError, RucEnUsoError } = require("../aplicacion/errores.cjs");

function respuestaFalsa() {
  return {
    estado: 200,
    cuerpo: undefined,
    status(n) { this.estado = n; return this; },
    json(c) { this.cuerpo = c; return this; }
  };
}

test("cada error se traduce al código HTTP correcto sin filtrar datos internos", async () => {
  const casos = [
    [new ConsultaInvalidaError("x"), 400, "PARAMETROS_INVALIDOS"],
    [new OfertaInvalidaError("x"), 400, "DATOS_INVALIDOS"],
    [new AccesoDenegadoError(), 403, "ACCESO_DENEGADO"],
    [new RucEnUsoError(), 409, "RUC_EN_USO"],
    [Object.assign(new Error("detalle interno"), { code: "ECONNREFUSED" }), 503, "SERVICIO_NO_DISPONIBLE"]
  ];
  const silencio = console.error;
  console.error = () => {};

  try {
    for (const [error, estado, codigo] of casos) {
      const falla = async () => { throw error; };
      const m = crearManejadores({
        listarOfertas: falla, listarFiltros: falla, publicarOferta: falla, listarMisOfertas: falla
      });

      for (const [nombre, req] of [
        ["filtros", {}], ["listar", { query: {} }],
        ["publicar", { usuario: { id: "1" }, body: {} }], ["mias", { usuario: { id: "1" } }]
      ]) {
        const res = respuestaFalsa();
        await m[nombre](req, res);
        assert.equal(res.estado, estado, nombre);
        assert.equal(res.cuerpo.codigo, codigo, nombre);
        assert.ok(!JSON.stringify(res.cuerpo).includes("interno"));
      }
    }
  } finally {
    console.error = silencio;
  }
});

test("publicar usa el id del token (no del cuerpo) y responde 201", async () => {
  let recibido;
  const m = crearManejadores({
    publicarOferta: async (id, cuerpo) => { recibido = { id, cuerpo }; return { id: "5" }; },
    listarMisOfertas: async (id) => ({ empresa: {}, items: [], id })
  });

  let res = respuestaFalsa();
  await m.publicar({ usuario: { id: "7" }, body: { empresa_id: "999", titulo: "t" } }, res);
  assert.equal(res.estado, 201);
  assert.equal(recibido.id, "7");

  res = respuestaFalsa();
  await m.mias({ usuario: { id: "7" } }, res);
  assert.equal(res.cuerpo.id, "7");
});

test("cerrar mi oferta usa el id del token y la oferta de la URL", async () => {
  let recibido;
  const m = crearManejadores({ cerrarMiOferta: async (...a) => { recibido = a; return { estado: "cerrada" }; } });
  const res = respuestaFalsa();

  await m.cerrar({ usuario: { id: "7" }, params: { id: "3" } }, res);
  assert.deepEqual(recibido, ["7", "3"]);
  assert.equal(res.estado, 200);
});
