const test = require("node:test");
const assert = require("node:assert/strict");

const {
  crearOfertasRepository,
  construirFiltros
} = require("./ofertas.repository.cjs");

test("sin filtros solo aplica las reglas de visibilidad", () => {
  const { donde, valores } = construirFiltros({});

  assert.match(donde, /o\.estado = 'publicada'/);
  assert.match(donde, /e\.estado = 'aprobada'/);
  assert.match(donde, /o\.fecha_limite >= CURRENT_DATE/);
  assert.deepEqual(valores, []);
});

test("cada filtro agrega un parámetro numerado", () => {
  const { donde, valores } = construirFiltros({
    q: "web",
    modalidad: "remota",
    carrera: "Ingeniería de Sistemas",
    ciclo: 8
  });

  assert.deepEqual(valores, [
    "%web%",
    "remota",
    "Ingeniería de Sistemas",
    8
  ]);
  assert.match(donde, /o\.modalidad = \$2/);
  assert.match(donde, /o\.ciclo_minimo <= \$4/);
});

test("el texto del usuario va como parámetro y no dentro del SQL", () => {
  const peligroso = "'; DROP TABLE ofertas.ofertas; --";
  const { donde, valores } = construirFiltros({ q: peligroso });

  assert.ok(!donde.includes("DROP"));
  assert.equal(valores[0], `%${peligroso}%`);
});

test("escapa los comodines de LIKE", () => {
  const { valores } = construirFiltros({ q: "100%_ok\\" });

  assert.equal(valores[0], "%100\\%\\_ok\\\\%");
});

test("calcula LIMIT y OFFSET según la página", async () => {
  const llamadas = [];
  const poolFalso = {
    async query(sql, valores) {
      llamadas.push({ sql, valores });
      return sql.includes("COUNT(*)")
        ? { rows: [{ total: 30 }] }
        : { rows: [{ id: 1 }] };
    }
  };

  const repositorio = crearOfertasRepository(poolFalso);
  const resultado = await repositorio.listarPublicadas({
    modalidad: "remota",
    page: 3,
    pageSize: 9
  });

  const consultaFilas = llamadas.find((l) => !l.sql.includes("COUNT(*)"));

  assert.match(consultaFilas.sql, /LIMIT \$2 OFFSET \$3/);
  assert.deepEqual(consultaFilas.valores, ["remota", 9, 18]);
  assert.deepEqual(resultado, { items: [{ id: 1 }], total: 30 });
});
