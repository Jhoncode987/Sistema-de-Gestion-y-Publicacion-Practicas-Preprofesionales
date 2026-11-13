const test = require("node:test");
const assert = require("node:assert/strict");

const {
  crearPostular,
  crearListarMisPostulaciones,
  crearRetirarPostulacion,
  crearListarPostulantes,
  crearDecidirPostulacion
} = require("./postulaciones.cjs");
const { evaluarElegibilidad, normalizar } = require("./elegibilidad.cjs");
const { AccesoDenegadoError, NoEncontradoError, ReglaDeNegocioError } = require("./errores.cjs");

const OFERTA = {
  id: "10", titulo: "Practicante de datos", empresa: "Demo SAC",
  carrera: "Ingeniería de Sistemas", ciclo_minimo: 6, creditos_minimos: 100,
  vacantes: 2, estado: "publicada", vigente: true
};
const ESTUDIANTE = {
  id: "1", rol: "estudiante", nombre: "Ana", codigoEstudiante: "20180123",
  correo: "ana@unsch.edu.pe", carrera: "Ingenieria  de sistemas", ciclo: 8, creditosAprobados: 150
};

function montar({ perfiles = {}, oferta = OFERTA } = {}) {
  const usuarios = {
    1: ESTUDIANTE,
    2: { ...ESTUDIANTE, id: "2", nombre: "Beto", codigoEstudiante: "20180124" },
    3: { ...ESTUDIANTE, id: "3", nombre: "Carla", codigoEstudiante: "20180125" },
    9: { id: "9", rol: "empresa", nombre: "Emp" },
    8: { id: "8", rol: "empresa", nombre: "Otra" },
    ...perfiles
  };
  const filas = [];
  const cerradas = [];
  let siguiente = 1;

  const repo = {
    async crear({ ofertaId, estudianteId }) {
      if (filas.some((f) => f.ofertaId === ofertaId && f.estudianteId === estudianteId)) return null;
      const f = { id: String(siguiente++), ofertaId, estudianteId, estado: "pendiente", motivo: null };
      filas.push(f);
      return { ...f };
    },
    async obtener(id) { return filas.find((f) => f.id === id) ?? null; },
    async listarPorEstudiante(id) { return filas.filter((f) => f.estudianteId === id); },
    async listarPorOferta(id) { return filas.filter((f) => f.ofertaId === id); },
    async retirar({ id, estudianteId }) {
      const f = filas.find((x) => x.id === id && x.estudianteId === estudianteId && x.estado === "pendiente");
      if (f) f.estado = "retirada";
      return f ? { ...f } : null;
    },
    async rechazar({ id, motivo }) {
      const f = filas.find((x) => x.id === id && x.estado === "pendiente");
      if (f) { f.estado = "rechazada"; f.motivo = motivo; }
      return f ? { ...f } : null;
    },
    async aceptar({ id, ofertaId, vacantes }) {
      const n = filas.filter((f) => f.ofertaId === ofertaId && f.estado === "aceptada").length;
      if (n >= vacantes) return { resultado: "SIN_CUPO" };
      const f = filas.find((x) => x.id === id && x.estado === "pendiente");
      if (!f) return { resultado: "TRANSICION" };
      f.estado = "aceptada";
      return { resultado: "ACEPTADA", postulacion: { ...f }, aceptadas: n + 1 };
    },
    async rechazarPendientesDeOferta(ofertaId, motivo) {
      filas.filter((f) => f.ofertaId === ofertaId && f.estado === "pendiente")
        .forEach((f) => { f.estado = "rechazada"; f.motivo = motivo; });
    }
  };
  const ofertas = {
    async obtenerOfertaParaPostular(id) { return id === oferta.id ? { ...oferta } : null; },
    async obtenerOfertasPorIds(ids) { return ids.includes(oferta.id) ? [{ id: oferta.id, titulo: oferta.titulo, empresa: oferta.empresa, estado: oferta.estado }] : []; },
    async obtenerOfertaDeEmpresaUsuario(usuarioId, ofertaId) {
      return usuarioId === "9" && ofertaId === oferta.id
        ? { id: oferta.id, titulo: oferta.titulo, vacantes: oferta.vacantes, estado: oferta.estado }
        : null;
    },
    async cerrarPorCupoLleno(id) { cerradas.push(id); return true; }
  };
  const dep = {
    postulacionesRepository: repo,
    obtenerPerfilUsuario: async (id) => usuarios[id] ?? null,
    obtenerPerfiles: async (ids) => ids.map((i) => usuarios[i]).filter(Boolean),
    ofertas
  };

  return { dep, filas, cerradas, postular: crearPostular(dep), decidir: crearDecidirPostulacion(dep) };
}

const falla = (promesa, Clase, codigo) =>
  assert.rejects(promesa, (e) => e instanceof Clase && (codigo === undefined || e.codigo === codigo));

test("normalizar ignora tildes, mayúsculas y espacios repetidos", () => {
  assert.equal(normalizar("  Ingeniería   de SISTEMAS "), "ingenieria de sistemas");
});

test("elegibilidad: cumple todo, o lista cada requisito incumplido", () => {
  const ok = { carrera: "ingenieria de sistemas", ciclo: 6, creditosAprobados: 100 };
  assert.deepEqual(evaluarElegibilidad(ok, OFERTA), []);
  const mal = { carrera: "Derecho", ciclo: 3, creditosAprobados: 10 };
  assert.equal(evaluarElegibilidad(mal, OFERTA).length, 3);
  assert.equal(evaluarElegibilidad({ ...ok, ciclo: 5 }, OFERTA).length, 1);
  assert.equal(evaluarElegibilidad({ ...ok, creditosAprobados: 99 }, OFERTA).length, 1);
});

test("un estudiante elegible postula y queda pendiente", async () => {
  const { postular } = montar();
  const p = await postular("1", { ofertaId: "10" });
  assert.equal(p.estado, "pendiente");
  assert.equal(p.estudianteId, "1");
});

test("no se puede postular dos veces a la misma oferta", async () => {
  const { postular } = montar();
  await postular("1", { ofertaId: "10" });
  await falla(postular("1", { ofertaId: "10" }), ReglaDeNegocioError, "POSTULACION_DUPLICADA");
});

test("solo estudiantes postulan (empresa y cuenta inexistente reciben acceso denegado)", async () => {
  const { postular } = montar();
  await falla(postular("9", { ofertaId: "10" }), AccesoDenegadoError);
  await falla(postular("77", { ofertaId: "10" }), AccesoDenegadoError);
});

test("ids de oferta inválidos u oferta inexistente: no encontrada", async () => {
  const { postular } = montar();
  for (const ofertaId of [undefined, "abc", "1; DROP", "99"]) {
    await falla(postular("1", { ofertaId }), NoEncontradoError);
  }
  await falla(postular("1", null), NoEncontradoError);
});

test("perfil académico incompleto: PERFIL_INCOMPLETO", async () => {
  const { postular } = montar({ perfiles: { 1: { ...ESTUDIANTE, ciclo: null } } });
  await falla(postular("1", { ofertaId: "10" }), ReglaDeNegocioError, "PERFIL_INCOMPLETO");
});

test("oferta no vigente: OFERTA_NO_VIGENTE", async () => {
  const { postular } = montar({ oferta: { ...OFERTA, vigente: false } });
  await falla(postular("1", { ofertaId: "10" }), ReglaDeNegocioError, "OFERTA_NO_VIGENTE");
});

test("no elegible: NO_ELEGIBLE con los motivos", async () => {
  const { postular } = montar({ perfiles: { 1: { ...ESTUDIANTE, ciclo: 2, creditosAprobados: 20 } } });
  await assert.rejects(postular("1", { ofertaId: "10" }), (e) =>
    e.codigo === "NO_ELEGIBLE" && e.detalle.length === 2);
});

test("mis postulaciones trae el detalle de cada oferta", async () => {
  const { dep, postular } = montar();
  await postular("1", { ofertaId: "10" });
  const r = await crearListarMisPostulaciones(dep)("1");
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].oferta.titulo, "Practicante de datos");
  await falla(crearListarMisPostulaciones(dep)("9"), AccesoDenegadoError);
});

test("retirar: propia pendiente sí; ajena = no existe; ya retirada = transición inválida", async () => {
  const { dep, postular } = montar();
  const p = await postular("1", { ofertaId: "10" });
  const retirar = crearRetirarPostulacion(dep);
  await falla(retirar("2", p.id), NoEncontradoError);
  assert.equal((await retirar("1", p.id)).estado, "retirada");
  await falla(retirar("1", p.id), ReglaDeNegocioError, "TRANSICION_INVALIDA");
  await falla(retirar("1", "xyz"), NoEncontradoError);
});

test("la empresa dueña ve a los postulantes con su perfil; otra empresa no", async () => {
  const { dep, postular } = montar();
  await postular("1", { ofertaId: "10" });
  const r = await crearListarPostulantes(dep)("9", "10");
  assert.equal(r.items[0].estudiante.nombre, "Ana");
  assert.equal(r.aceptadas, 0);
  await falla(crearListarPostulantes(dep)("8", "10"), NoEncontradoError);
  await falla(crearListarPostulantes(dep)("1", "10"), AccesoDenegadoError);
});

test("aceptar y rechazar: solo la empresa dueña; ajenas ven 'no existe'", async () => {
  const { dep, postular, decidir } = montar();
  const p = await postular("1", { ofertaId: "10" });
  await falla(decidir.aceptar("8", p.id), NoEncontradoError);
  await falla(decidir.aceptar("1", p.id), AccesoDenegadoError);
  await falla(decidir.rechazar("8", p.id, {}), NoEncontradoError);
  const r = await decidir.rechazar("9", p.id, { motivo: "  Perfil no ajustado " });
  assert.equal(r.postulacion.motivo, "Perfil no ajustado");
  await falla(decidir.rechazar("9", p.id, {}), ReglaDeNegocioError, "TRANSICION_INVALIDA");
  await falla(decidir.aceptar("9", p.id), ReglaDeNegocioError, "TRANSICION_INVALIDA");
  await assert.rejects(decidir.rechazar("9", p.id, { motivo: "x".repeat(501) }), /500/);
});

test("al cubrirse las vacantes la oferta se cierra y los pendientes se rechazan", async () => {
  const { postular, decidir, filas, cerradas } = montar();
  const a = await postular("1", { ofertaId: "10" });
  const b = await postular("2", { ofertaId: "10" });
  const c = await postular("3", { ofertaId: "10" });

  const r1 = await decidir.aceptar("9", a.id);
  assert.deepEqual([r1.aceptadas, r1.ofertaCerrada], [1, false]);
  assert.deepEqual(cerradas, []);

  const r2 = await decidir.aceptar("9", b.id);
  assert.deepEqual([r2.aceptadas, r2.ofertaCerrada], [2, true]);
  assert.deepEqual(cerradas, ["10"]);
  const ultima = filas.find((f) => f.id === c.id);
  assert.equal(ultima.estado, "rechazada");
  assert.match(ultima.motivo, /vacantes/i);
});

test("sin cupo no se acepta; con oferta cerrada tampoco", async () => {
  const { postular, decidir } = montar({ oferta: { ...OFERTA, vacantes: 1 } });
  const a = await postular("1", { ofertaId: "10" });
  await decidir.aceptar("9", a.id);
  const { postular: p2, decidir: d2 } = montar({ oferta: { ...OFERTA, estado: "cerrada" } });
  const x = await p2("1", { ofertaId: "10" });
  await falla(d2.aceptar("9", x.id), ReglaDeNegocioError, "OFERTA_NO_VIGENTE");
});
