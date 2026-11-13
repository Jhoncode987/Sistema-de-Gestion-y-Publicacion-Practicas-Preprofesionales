const test = require("node:test");
const assert = require("node:assert/strict");

const {
  crearPublicarOferta,
  crearListarMisOfertas,
  validarOferta,
  hoyEnLima
} = require("./publicar-oferta.cjs");
const { OfertaInvalidaError, AccesoDenegadoError, RucEnUsoError } = require("./errores.cjs");

// 2026-11-12 22:30 en Lima = 2026-11-13 03:30 UTC: "hoy" en Perú sigue siendo el 12.
const AHORA = Date.UTC(2026, 10, 13, 3, 30);
const HOY = "2026-11-12";

const valida = {
  titulo: "  Practicante   de desarrollo web ",
  descripcion: "Apoyo en el desarrollo de módulos web con React y Node.js.",
  carrera: "Ingeniería de Sistemas",
  ciclo_minimo: "8",
  creditos_minimos: 100,
  modalidad: "HIBRIDA",
  vacantes: 2,
  fecha_limite: "2026-12-31"
};

function entorno({ perfil, rucEnUso = false } = {}) {
  const llamadas = { empresas: [], ofertas: [] };
  const repo = {
    llamadas,
    async obtenerOCrearEmpresa(d) {
      llamadas.empresas.push(d);

      if (rucEnUso) throw new RucEnUsoError();

      return { id: "10", ruc: d.ruc, razonSocial: d.razonSocial, estado: "pendiente" };
    },
    async crearOferta(d) {
      llamadas.ofertas.push(d);
      return { id: "1", ...d, estado: "pendiente_revision" };
    },
    async listarPorEmpresa(id) {
      return [{ id: "1", empresa_id: id }];
    }
  };
  const obtenerPerfilUsuario = async () =>
    perfil === undefined
      ? { id: "7", rol: "empresa", ruc: "20123456789", razonSocial: "Empresa Real S.A.C." }
      : perfil;

  return { repo, obtenerPerfilUsuario };
}

test("la fecha de hoy se calcula en hora de Perú, no en UTC", () => {
  assert.equal(hoyEnLima(() => AHORA), HOY);
});

test("normaliza una oferta válida", () => {
  const d = validarOferta(valida, HOY);

  assert.equal(d.titulo, "Practicante de desarrollo web");
  assert.equal(d.ciclo_minimo, 8);
  assert.equal(d.modalidad, "hibrida");
  assert.equal(d.creditos_minimos, 100);
});

test("créditos mínimos es opcional y vale 0", () => {
  const { creditos_minimos, ...sin } = valida;
  assert.equal(validarOferta(sin, HOY).creditos_minimos, 0);
});

test("rechaza ofertas inválidas", () => {
  const malos = [
    null,
    { ...valida, titulo: "Hola" },
    { ...valida, titulo: 5 },
    { ...valida, descripcion: "corta" },
    { ...valida, descripcion: "x".repeat(2001) },
    { ...valida, carrera: "" },
    { ...valida, modalidad: "nocturna" },
    { ...valida, ciclo_minimo: 0 },
    { ...valida, ciclo_minimo: 11 },
    { ...valida, ciclo_minimo: "abc" },
    { ...valida, ciclo_minimo: 7.5 },
    { ...valida, creditos_minimos: -1 },
    { ...valida, vacantes: 0 },
    { ...valida, vacantes: 101 },
    { ...valida, fecha_limite: HOY },
    { ...valida, fecha_limite: "2026-11-01" },
    { ...valida, fecha_limite: "2026-02-30" },
    { ...valida, fecha_limite: "31/12/2026" },
    { ...valida, fecha_limite: "2028-01-01" },
    { ...valida, fecha_limite: undefined }
  ];

  for (const entrada of malos) {
    assert.throws(() => validarOferta(entrada, HOY), OfertaInvalidaError, JSON.stringify(entrada));
  }
});

test("la fecha de mañana es válida", () => {
  assert.equal(validarOferta({ ...valida, fecha_limite: "2026-11-13" }, HOY).fecha_limite, "2026-11-13");
});

test("publica a nombre de la empresa de la cuenta; ignora campos de más", async () => {
  const { repo, obtenerPerfilUsuario } = entorno();
  const publicar = crearPublicarOferta({
    ofertasRepository: repo,
    obtenerPerfilUsuario,
    ahora: () => AHORA
  });

  const oferta = await publicar("7", { ...valida, estado: "publicada", empresa_id: "999" });

  assert.equal(oferta.estado, "pendiente_revision");
  assert.equal(repo.llamadas.ofertas[0].empresaId, "10");
  assert.equal("estado" in repo.llamadas.ofertas[0], false);
  assert.deepEqual(repo.llamadas.empresas[0], {
    usuarioId: "7",
    ruc: "20123456789",
    razonSocial: "Empresa Real S.A.C."
  });
});

test("no crea la empresa si los datos de la oferta están mal", async () => {
  const { repo, obtenerPerfilUsuario } = entorno();
  const publicar = crearPublicarOferta({ ofertasRepository: repo, obtenerPerfilUsuario, ahora: () => AHORA });

  await assert.rejects(publicar("7", { ...valida, vacantes: 0 }), OfertaInvalidaError);
  assert.equal(repo.llamadas.empresas.length, 0);
});

test("estudiantes, coordinadores y cuentas inactivas no pueden publicar", async () => {
  for (const perfil of [
    { id: "1", rol: "estudiante" },
    { id: "2", rol: "coordinador" },
    null
  ]) {
    const { repo, obtenerPerfilUsuario } = entorno({ perfil });
    const publicar = crearPublicarOferta({ ofertasRepository: repo, obtenerPerfilUsuario, ahora: () => AHORA });

    await assert.rejects(publicar("1", valida), AccesoDenegadoError);
    assert.equal(repo.llamadas.ofertas.length, 0);
  }
});

test("un RUC en poder de otra cuenta se informa", async () => {
  const { repo, obtenerPerfilUsuario } = entorno({ rucEnUso: true });
  const publicar = crearPublicarOferta({ ofertasRepository: repo, obtenerPerfilUsuario, ahora: () => AHORA });

  await assert.rejects(publicar("7", valida), RucEnUsoError);
});

test("lista las ofertas de la propia empresa con su estado de validación", async () => {
  const { repo, obtenerPerfilUsuario } = entorno();
  const listar = crearListarMisOfertas({ ofertasRepository: repo, obtenerPerfilUsuario });
  const r = await listar("7");

  assert.deepEqual(r.empresa, { razonSocial: "Empresa Real S.A.C.", ruc: "20123456789", estado: "pendiente", motivoRechazo: null });
  assert.equal(r.items[0].empresa_id, "10");

  const otro = entorno({ perfil: { id: "1", rol: "estudiante" } });
  await assert.rejects(
    crearListarMisOfertas({ ofertasRepository: otro.repo, obtenerPerfilUsuario: otro.obtenerPerfilUsuario })("1"),
    AccesoDenegadoError
  );
});

const { crearCerrarMiOferta } = require("./publicar-oferta.cjs");
const { NoEncontradoError, TransicionInvalidaError } = require("./errores.cjs");

function entornoCierre({ cerrada = null, propia = null, perfil } = {}) {
  const e = entorno({ perfil });
  e.repo.cerrarOfertaDeEmpresa = async (d) => { e.repo.llamadas.ofertas.push(["cerrar", d]); return cerrada; };
  e.repo.obtenerOfertaDeEmpresa = async () => propia;
  return e;
}

test("la empresa cierra una oferta propia y la consulta lleva el id de SU empresa", async () => {
  const { repo, obtenerPerfilUsuario } = entornoCierre({ cerrada: { id: "5", estado: "cerrada" } });
  const r = await crearCerrarMiOferta({ ofertasRepository: repo, obtenerPerfilUsuario })("7", "5");

  assert.equal(r.estado, "cerrada");
  assert.deepEqual(repo.llamadas.ofertas[0], ["cerrar", { id: "5", empresaId: "10" }]);
});

test("cerrar una oferta ajena o inexistente responde igual (404), y una ya cerrada da 409", async () => {
  const cerrar = (e) => crearCerrarMiOferta({ ofertasRepository: e.repo, obtenerPerfilUsuario: e.obtenerPerfilUsuario })("7", "5");

  await assert.rejects(cerrar(entornoCierre()), NoEncontradoError);
  await assert.rejects(
    cerrar(entornoCierre({ propia: { id: "5", estado: "cerrada" } })),
    (e) => e instanceof TransicionInvalidaError && e.codigo === "TRANSICION_INVALIDA"
  );

  const e = entornoCierre();
  for (const id of ["abc", "1;DROP", "-3", ""]) {
    await assert.rejects(
      crearCerrarMiOferta({ ofertasRepository: e.repo, obtenerPerfilUsuario: e.obtenerPerfilUsuario })("7", id),
      NoEncontradoError, id
    );
  }
});

test("solo una empresa puede cerrar con este caso de uso", async () => {
  for (const perfil of [{ id: "1", rol: "estudiante" }, { id: "2", rol: "coordinador" }, null]) {
    const e = entornoCierre({ perfil, cerrada: { id: "5" } });
    await assert.rejects(
      crearCerrarMiOferta({ ofertasRepository: e.repo, obtenerPerfilUsuario: e.obtenerPerfilUsuario })("1", "5"),
      AccesoDenegadoError
    );
  }
});
