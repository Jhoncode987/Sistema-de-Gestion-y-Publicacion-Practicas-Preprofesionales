const test = require("node:test");
const assert = require("node:assert/strict");

const {
  crearListarOfertas,
  normalizarConsulta,
  ConsultaInvalidaError
} = require("./listar-ofertas.cjs");

test("usa valores por defecto cuando no hay parámetros", () => {
  assert.deepEqual(normalizarConsulta({}), {
    q: undefined,
    modalidad: undefined,
    carrera: undefined,
    ciclo: undefined,
    page: 1,
    pageSize: 9
  });
});

test("limpia espacios y convierte los números", () => {
  const consulta = normalizarConsulta({
    q: "  web  ",
    modalidad: "HIBRIDA",
    ciclo: "8",
    page: "2",
    pageSize: "20"
  });

  assert.equal(consulta.q, "web");
  assert.equal(consulta.modalidad, "hibrida");
  assert.equal(consulta.ciclo, 8);
  assert.equal(consulta.page, 2);
  assert.equal(consulta.pageSize, 20);
});

test("trata los textos vacíos como si no existieran", () => {
  const consulta = normalizarConsulta({ q: "   ", carrera: "", ciclo: "" });

  assert.equal(consulta.q, undefined);
  assert.equal(consulta.carrera, undefined);
  assert.equal(consulta.ciclo, undefined);
});

test("rechaza parámetros inválidos", () => {
  const invalidos = [
    { modalidad: "nocturna" },
    { ciclo: "0" },
    { ciclo: "13" },
    { ciclo: "abc" },
    { page: "0" },
    { page: "-1" },
    { pageSize: "51" },
    { q: ["a", "b"] },
    { q: "x".repeat(101) }
  ];

  for (const entrada of invalidos) {
    assert.throws(
      () => normalizarConsulta(entrada),
      ConsultaInvalidaError,
      JSON.stringify(entrada)
    );
  }
});

test("listarOfertas pide al repositorio la consulta normalizada", async () => {
  let recibida;
  const repositorioFalso = {
    async listarPublicadas(consulta) {
      recibida = consulta;
      return { items: [{ id: 1 }], total: 25 };
    }
  };

  const listarOfertas = crearListarOfertas(repositorioFalso);
  const resultado = await listarOfertas({ page: "3", pageSize: "5" });

  assert.equal(recibida.page, 3);
  assert.equal(recibida.pageSize, 5);
  assert.deepEqual(resultado, {
    items: [{ id: 1 }],
    page: 3,
    pageSize: 5,
    total: 25
  });
});
