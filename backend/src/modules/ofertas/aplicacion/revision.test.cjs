const test = require("node:test");
const assert = require("node:assert/strict");

const {
  crearListarPendientes,
  crearDecidirEmpresa,
  crearDecidirOferta
} = require("./revision.cjs");
const {
  OfertaInvalidaError,
  AccesoDenegadoError,
  NoEncontradoError,
  TransicionInvalidaError
} = require("./errores.cjs");

function entorno({ rol = "coordinador", empresa, oferta, actualizada = null } = {}) {
  const llamadas = [];
  const repo = {
    llamadas,
    async listarEmpresasPorEstado(e) { llamadas.push(["empresas", e]); return [{ id: "1" }]; },
    async listarOfertasPorEstado(e) { llamadas.push(["ofertas", e]); return [{ id: "2" }]; },
    async obtenerEmpresa() { return empresa ?? null; },
    async decidirEmpresa(d) { llamadas.push(["decidirEmpresa", d]); return actualizada; },
    async obtenerOfertaParaRevision() { return oferta ?? null; },
    async decidirOferta(d) { llamadas.push(["decidirOferta", d]); return actualizada; }
  };
  const obtenerPerfilUsuario = async () => (rol ? { id: "9", rol } : null);

  return { repo, deps: { ofertasRepository: repo, obtenerPerfilUsuario } };
}

test("solo el coordinador puede ver y decidir; empresas, estudiantes y cuentas inactivas no", async () => {
  for (const rol of ["empresa", "estudiante", null]) {
    const { repo, deps } = entorno({ rol });

    await assert.rejects(crearListarPendientes(deps)("1"), AccesoDenegadoError);
    await assert.rejects(crearDecidirEmpresa(deps)("1", "5", "aprobar"), AccesoDenegadoError);
    await assert.rejects(crearDecidirOferta(deps)("1", "5", "aprobar"), AccesoDenegadoError);
    assert.equal(repo.llamadas.length, 0);
  }
});

test("lista empresas y ofertas pendientes", async () => {
  const { deps, repo } = entorno();
  const r = await crearListarPendientes(deps)("9");

  assert.deepEqual(r, { empresas: [{ id: "1" }], ofertas: [{ id: "2" }] });
  assert.deepEqual(repo.llamadas, [["empresas", "pendiente"], ["ofertas", "pendiente_revision"]]);
});

test("aprobar empresa registra al coordinador y no pide motivo", async () => {
  const { deps, repo } = entorno({ actualizada: { id: "5", estado: "aprobada" } });
  const r = await crearDecidirEmpresa(deps)("9", "5", "aprobar");

  assert.equal(r.estado, "aprobada");
  assert.deepEqual(repo.llamadas[0][1], { id: "5", estado: "aprobada", motivo: null, decididoPor: "9" });
});

test("rechazar exige un motivo razonable y lo guarda recortado", async () => {
  const { deps, repo } = entorno({ actualizada: { id: "5", estado: "rechazada" } });
  const decidir = crearDecidirEmpresa(deps);

  for (const motivo of [undefined, "", "   ", "no", "x".repeat(501), 42]) {
    await assert.rejects(decidir("9", "5", "rechazar", motivo), OfertaInvalidaError);
  }

  await decidir("9", "5", "rechazar", "  RUC no figura en SUNAT  ");
  assert.equal(repo.llamadas.at(-1)[1].motivo, "RUC no figura en SUNAT");
  assert.equal(repo.llamadas.at(-1)[1].estado, "rechazada");
});

test("acciones e ids inválidos se rechazan antes de tocar la base", async () => {
  const { deps, repo } = entorno();

  await assert.rejects(crearDecidirOferta(deps)("9", "5", "borrar"), OfertaInvalidaError);
  for (const id of ["abc", "1; DROP TABLE x", "-1", "", "9".repeat(30)]) {
    await assert.rejects(crearDecidirOferta(deps)("9", id, "aprobar"), NoEncontradoError, id);
  }
  assert.equal(repo.llamadas.length, 0);
});

test("empresa inexistente o ya revisada", async () => {
  await assert.rejects(
    crearDecidirEmpresa(entorno().deps)("9", "5", "aprobar"),
    NoEncontradoError
  );

  await assert.rejects(
    crearDecidirEmpresa(entorno({ empresa: { id: "5", estado: "aprobada" } }).deps)("9", "5", "aprobar"),
    (e) => e instanceof TransicionInvalidaError && e.codigo === "TRANSICION_INVALIDA"
  );
});

test("la oferta explica por qué no se pudo publicar", async () => {
  const decidir = (oferta) => crearDecidirOferta(entorno({ oferta }).deps)("9", "5", "aprobar");

  await assert.rejects(decidir(undefined), NoEncontradoError);
  await assert.rejects(
    decidir({ estado: "publicada", empresaEstado: "aprobada" }),
    (e) => e.codigo === "TRANSICION_INVALIDA"
  );
  await assert.rejects(
    decidir({ estado: "pendiente_revision", empresaEstado: "pendiente" }),
    (e) => e.codigo === "EMPRESA_NO_APROBADA"
  );
  await assert.rejects(
    decidir({ estado: "pendiente_revision", empresaEstado: "aprobada" }),
    (e) => e.codigo === "OFERTA_VENCIDA"
  );
});

test("publicar una oferta devuelve la oferta actualizada", async () => {
  const { deps, repo } = entorno({ actualizada: { id: "5", estado: "publicada" } });
  const r = await crearDecidirOferta(deps)("9", "5", "aprobar");

  assert.equal(r.estado, "publicada");
  assert.equal(repo.llamadas[0][1].estado, "publicada");
});

const { crearCerrarOferta } = require("./revision.cjs");

test("el coordinador cierra una oferta publicada con motivo y queda registrado", async () => {
  const { deps, repo } = entorno({ actualizada: null });
  repo.cerrarOfertaPorCoordinador = async (d) => { repo.llamadas.push(["cerrar", d]); return { id: "5", estado: "cerrada" }; };

  const r = await crearCerrarOferta(deps)("9", "5", "  Convocatoria duplicada  ");
  assert.equal(r.estado, "cerrada");
  assert.deepEqual(repo.llamadas[0][1], { id: "5", motivo: "Convocatoria duplicada", decididoPor: "9" });
});

test("cerrar exige motivo, rol de coordinador y una oferta publicada", async () => {
  const e = entorno();
  e.repo.cerrarOfertaPorCoordinador = async () => null;

  await assert.rejects(crearCerrarOferta(e.deps)("9", "5", ""), OfertaInvalidaError);
  await assert.rejects(crearCerrarOferta(e.deps)("9", "x", "motivo válido"), NoEncontradoError);
  await assert.rejects(crearCerrarOferta(e.deps)("9", "5", "motivo válido"), NoEncontradoError);

  const ya = entorno({ oferta: { estado: "cerrada", empresaEstado: "aprobada" } });
  ya.repo.cerrarOfertaPorCoordinador = async () => null;
  await assert.rejects(
    crearCerrarOferta(ya.deps)("9", "5", "motivo válido"),
    (x) => x.codigo === "TRANSICION_INVALIDA"
  );

  for (const rol of ["empresa", "estudiante", null]) {
    const o = entorno({ rol });
    o.repo.cerrarOfertaPorCoordinador = async () => ({ id: "5" });
    await assert.rejects(crearCerrarOferta(o.deps)("1", "5", "motivo válido"), AccesoDenegadoError);
  }
});
