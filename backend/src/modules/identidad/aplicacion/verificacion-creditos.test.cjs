const test = require("../../../compartido/pruebas.cjs");
const assert = require("node:assert/strict");

const {
  crearSubirReporteNotas,
  crearListarEstudiantes,
  crearObtenerReporteNotas,
  crearVerificarCreditos
} = require("./verificacion-creditos.cjs");
const { AccesoDenegadoError, DatosInvalidosError, NoEncontradoError } = require("./errores.cjs");

const PDF = Buffer.from("%PDF-1.4 contenido de prueba");

function montar() {
  const usuarios = {
    1: { id: "1", rol: "estudiante", activo: true, nombre: "Ana" },
    2: { id: "2", rol: "estudiante", activo: true, nombre: "Beto" },
    5: { id: "5", rol: "coordinador", activo: true, nombre: "Coord" },
    9: { id: "9", rol: "empresa", activo: true, nombre: "Emp" }
  };
  const reportes = new Map();
  const verificados = new Map();
  const llamadas = { listar: null };
  const repo = {
    async buscarPorId(id) { return usuarios[id] ?? null; },
    async guardarReporte(id, contenido) { reportes.set(id, contenido); },
    async obtenerReporte(id) { return reportes.get(id) ?? null; },
    async listarEstudiantes(p) { llamadas.listar = p; return { items: [{ id: "1", nombre: "Ana", correo: "a@x", hashClave: "no" }], total: 1 }; },
    async verificarCreditos({ id, creditos, coordinadorId }) {
      if (!reportes.has(id)) return null;
      verificados.set(id, { creditos, coordinadorId });
      return { id, creditosAprobados: creditos, creditosVerificados: true };
    }
  };
  const dep = { usuariosRepository: repo };

  return {
    reportes, verificados, llamadas,
    subir: crearSubirReporteNotas(dep),
    listar: crearListarEstudiantes(dep),
    obtener: crearObtenerReporteNotas(dep),
    verificar: crearVerificarCreditos(dep)
  };
}

const falla = (p, Clase) => assert.rejects(p, (e) => e instanceof Clase);

test("subir reporte: solo estudiantes, solo PDF y hasta 2 MB", async () => {
  const m = montar();
  assert.deepEqual(await m.subir("1", PDF), { subido: true });
  assert.equal(m.reportes.get("1"), PDF);

  await falla(m.subir("5", PDF), AccesoDenegadoError);
  await falla(m.subir("9", PDF), AccesoDenegadoError);
  await falla(m.subir("1", Buffer.from("no es un pdf")), DatosInvalidosError);
  await falla(m.subir("1", Buffer.alloc(0)), DatosInvalidosError);
  await falla(m.subir("1", {}), DatosInvalidosError);
  await falla(m.subir("1", undefined), DatosInvalidosError);
  await falla(m.subir("1", Buffer.concat([PDF, Buffer.alloc(2 * 1024 * 1024)])), DatosInvalidosError);
});

test("listar estudiantes: solo coordinador, filtro y página válidos, sin datos de más", async () => {
  const m = montar();
  await falla(m.listar("1"), AccesoDenegadoError);

  const r = await m.listar("5");
  assert.deepEqual([m.llamadas.listar.estado, m.llamadas.listar.desplazamiento], ["pendientes", 0]);
  assert.equal("hashClave" in r.items[0], false);

  await m.listar("5", { estado: "todos", page: "3" });
  assert.deepEqual([m.llamadas.listar.estado, m.llamadas.listar.desplazamiento], ["todos", 40]);

  for (const c of [{ estado: "otro" }, { page: "0" }, { page: "x" }]) {
    await falla(m.listar("5", c), DatosInvalidosError);
  }
});

test("ver el reporte: solo coordinador; sin reporte o id inválido da 'no existe'", async () => {
  const m = montar();
  await m.subir("1", PDF);
  assert.equal(await m.obtener("5", "1"), PDF);
  await falla(m.obtener("1", "1"), AccesoDenegadoError);
  await falla(m.obtener("5", "2"), NoEncontradoError);
  await falla(m.obtener("5", "abc"), NoEncontradoError);
});

test("verificar créditos: solo coordinador, con reporte y total entero entre 0 y 250", async () => {
  const m = montar();
  await m.subir("1", PDF);

  await falla(m.verificar("1", "1", { creditos: 170 }), AccesoDenegadoError);
  await falla(m.verificar("9", "1", { creditos: 170 }), AccesoDenegadoError);
  await falla(m.verificar("5", "2", { creditos: 170 }), NoEncontradoError); // sin reporte
  await falla(m.verificar("5", "abc", { creditos: 170 }), NoEncontradoError);

  for (const creditos of [undefined, "170", 170.5, -1, 251, null]) {
    await falla(m.verificar("5", "1", { creditos }), DatosInvalidosError);
  }

  const r = await m.verificar("5", "1", { creditos: 172 });
  assert.equal(r.estudiante.creditosVerificados, true);
  assert.deepEqual(m.verificados.get("1"), { creditos: 172, coordinadorId: "5" });
});
