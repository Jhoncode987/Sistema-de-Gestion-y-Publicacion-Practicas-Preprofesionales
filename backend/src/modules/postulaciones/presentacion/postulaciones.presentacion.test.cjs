const test = require("node:test");
const assert = require("node:assert/strict");

const { crearManejadores } = require("./postulaciones.manejadores.cjs");
const { ReglaDeNegocioError, NoEncontradoError, AccesoDenegadoError } = require("../aplicacion/errores.cjs");

function res() {
  return { codigo: 200, cuerpo: null, status(c) { this.codigo = c; return this; }, json(c) { this.cuerpo = c; return this; } };
}

const base = {
  postular: async (id, b) => ({ id: "1", ofertaId: b.ofertaId, estudianteId: id }),
  listarMisPostulaciones: async () => ({ items: [] }),
  retirarPostulacion: async () => ({ estado: "retirada" }),
  listarPostulantes: async () => ({ items: [] }),
  decidirPostulacion: { aceptar: async () => ({ ofertaCerrada: true }), rechazar: async () => ({}) }
};

test("postular responde 201 con la postulación", async () => {
  const r = res();
  await crearManejadores(base).postular({ usuario: { id: "5" }, body: { ofertaId: "9" } }, r);
  assert.equal(r.codigo, 201);
  assert.equal(r.cuerpo.estudianteId, "5");
});

test("las reglas de negocio responden 409 con código y motivos", async () => {
  const m = crearManejadores({ ...base, postular: async () => { throw new ReglaDeNegocioError("NO_ELEGIBLE", "No cumples", ["ciclo"]); } });
  const r = res();
  await m.postular({ usuario: { id: "5" }, body: {} }, r);
  assert.deepEqual([r.codigo, r.cuerpo.codigo, r.cuerpo.motivos], [409, "NO_ELEGIBLE", ["ciclo"]]);
});

test("403 y 404 con su código", async () => {
  for (const [Clase, codigo, http] of [[AccesoDenegadoError, "ACCESO_DENEGADO", 403], [NoEncontradoError, "NO_ENCONTRADO", 404]]) {
    const m = crearManejadores({ ...base, retirarPostulacion: async () => { throw new Clase(); } });
    const r = res();
    await m.retirar({ usuario: { id: "5" }, params: { id: "1" } }, r);
    assert.deepEqual([r.codigo, r.cuerpo.codigo], [http, codigo]);
  }
});

test("un error inesperado responde 503 sin filtrar detalles", async () => {
  const m = crearManejadores({ ...base, listarMisPostulaciones: async () => { throw new Error("password=secreto host=db"); } });
  const r = res();
  const original = console.error; console.error = () => {};
  await m.mias({ usuario: { id: "5" } }, r);
  console.error = original;
  assert.equal(r.codigo, 503);
  assert.doesNotMatch(JSON.stringify(r.cuerpo), /secreto|host/);
});

test("aceptar devuelve el resultado con ofertaCerrada", async () => {
  const r = res();
  await crearManejadores(base).aceptar({ usuario: { id: "9" }, params: { id: "3" } }, r);
  assert.deepEqual([r.codigo, r.cuerpo.ofertaCerrada], [200, true]);
});
