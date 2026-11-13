const test = require("node:test");
const assert = require("node:assert/strict");

const { hashearClave, verificarClave } = require("./claves.cjs");
const { crearServicioTokens } = require("./tokens.cjs");
const { crearLimitadorIntentos } = require("./limitador-intentos.cjs");
const {
  crearRegistrarUsuario,
  crearCrearCoordinador,
  validarRegistro
} = require("./registrar-usuario.cjs");
const { crearIniciarSesion } = require("./iniciar-sesion.cjs");
const { crearObtenerPerfil } = require("./obtener-perfil.cjs");
const {
  DatosInvalidosError,
  CredencialesInvalidasError,
  DemasiadosIntentosError,
  CuentaDuplicadaError
} = require("./errores.cjs");

const SECRETO = "s".repeat(40);

function repositorioEnMemoria() {
  const filas = [];

  return {
    filas,
    async crear(d) {
      if (filas.some((f) => f.correo === d.correo)) {
        throw new CuentaDuplicadaError();
      }

      const fila = {
        id: String(filas.length + 1),
        correo: d.correo,
        rol: d.rol,
        nombre: d.nombre,
        codigoEstudiante: d.codigoEstudiante ?? null,
        ruc: d.ruc ?? null,
        razonSocial: d.razonSocial ?? null,
        activo: true,
        hashClave: d.hashClave
      };

      filas.push(fila);
      const { hashClave, ...publico } = fila;
      return publico;
    },
    async buscarPorCorreo(correo) {
      return filas.find((f) => f.correo === correo) ?? null;
    },
    async buscarPorId(id) {
      return filas.find((f) => f.id === String(id)) ?? null;
    }
  };
}

const estudiante = {
  rol: "estudiante",
  correo: "  Ana@Unsch.edu.pe ",
  clave: "clave-segura-1",
  nombre: "Ana  Quispe",
  codigoEstudiante: "20180123"
};

test("hashea la clave sin guardarla en claro y la verifica", async () => {
  const hash = await hashearClave("mi-clave-123");

  assert.match(hash, /^scrypt\$16384\$/);
  assert.ok(!hash.includes("mi-clave-123"));
  assert.equal(await verificarClave("mi-clave-123", hash), true);
  assert.equal(await verificarClave("otra-clave-123", hash), false);
  assert.equal(await verificarClave("x", "formato-roto"), false);
});

test("dos hashes de la misma clave son distintos (sal aleatoria)", async () => {
  assert.notEqual(await hashearClave("igual-1234"), await hashearClave("igual-1234"));
});

test("el token se emite, se verifica y vence", () => {
  let ahora = 1_000_000_000_000;
  const tokens = crearServicioTokens({ secreto: SECRETO, ahora: () => ahora });
  const token = tokens.emitir({ id: "7", rol: "empresa" });

  assert.deepEqual(tokens.verificar(token), { id: "7", rol: "empresa" });

  ahora += 8 * 60 * 60 * 1000 + 1000;
  assert.equal(tokens.verificar(token), null);
});

test("rechaza tokens manipulados, de otro secreto o mal formados", () => {
  const tokens = crearServicioTokens({ secreto: SECRETO });
  const otro = crearServicioTokens({ secreto: "z".repeat(40) });
  const token = tokens.emitir({ id: "1", rol: "estudiante" });
  const [c, , f] = token.split(".");
  const cargaFalsa = Buffer.from(
    JSON.stringify({ sub: "1", rol: "coordinador", exp: 9999999999 })
  ).toString("base64url");

  assert.equal(tokens.verificar(`${c}.${cargaFalsa}.${f}`), null);
  assert.equal(otro.verificar(token), null);
  assert.equal(tokens.verificar("abc"), null);
  assert.equal(tokens.verificar(undefined), null);

  const sinFirma = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${cargaFalsa}.`;
  assert.equal(tokens.verificar(sinFirma), null);
});

test("exige un secreto largo", () => {
  assert.throws(() => crearServicioTokens({ secreto: "corto" }));
  assert.throws(() => crearServicioTokens({}));
});

test("registra estudiante: normaliza correo y nombre, y devuelve token sin hash", async () => {
  const repo = repositorioEnMemoria();
  const tokens = crearServicioTokens({ secreto: SECRETO });
  const registrar = crearRegistrarUsuario({ usuariosRepository: repo, tokens });

  const { usuario, token } = await registrar(estudiante);

  assert.equal(usuario.correo, "ana@unsch.edu.pe");
  assert.equal(usuario.nombre, "Ana Quispe");
  assert.equal(usuario.rol, "estudiante");
  assert.equal("hashClave" in usuario, false);
  assert.deepEqual(tokens.verificar(token), { id: "1", rol: "estudiante" });
  assert.notEqual(repo.filas[0].hashClave, estudiante.clave);
});

test("registra empresa con RUC y razón social", () => {
  const datos = validarRegistro({
    rol: "empresa",
    correo: "rrhh@empresa.pe",
    clave: "clave-segura-1",
    nombre: "María Rojas",
    ruc: "20123456789",
    razonSocial: "Empresa Real S.A.C."
  });

  assert.equal(datos.rol, "empresa");
  assert.equal(datos.ruc, "20123456789");
});

test("no permite registrarse como coordinador ni datos inválidos", () => {
  const base = { ...estudiante, correo: "a@unsch.edu.pe" };
  const malos = [
    null,
    { ...base, rol: "coordinador" },
    { ...base, rol: undefined },
    { ...base, correo: "sin-arroba" },
    { ...base, clave: "corta" },
    { ...base, clave: 12345678 },
    { ...base, nombre: "A" },
    { ...base, codigoEstudiante: "12ab" },
    { ...base, codigoEstudiante: undefined },
    { rol: "empresa", correo: "a@b.pe", clave: "clave-segura-1", nombre: "Ok", ruc: "123", razonSocial: "X Y" },
    { rol: "empresa", correo: "a@b.pe", clave: "clave-segura-1", nombre: "Ok", ruc: "20123456789" }
  ];

  for (const entrada of malos) {
    assert.throws(() => validarRegistro(entrada), DatosInvalidosError, JSON.stringify(entrada));
  }
});

test("el estudiante exige correo institucional; la empresa puede usar cualquiera", () => {
  for (const correo of ["ana@gmail.com", "ana@unsch.edu.pe.falso.com", "ana@xunsch.edu.pe", "ana@unsch.edu.com"]) {
    assert.throws(
      () => validarRegistro({ ...estudiante, correo }),
      /correo institucional/,
      correo
    );
  }

  for (const correo of ["ana@unsch.edu.pe", "ANA@UNSCH.EDU.PE", "ana@est.unsch.edu.pe"]) {
    assert.equal(validarRegistro({ ...estudiante, correo }).rol, "estudiante", correo);
  }

  assert.equal(
    validarRegistro({
      rol: "empresa", correo: "rrhh@gmail.com", clave: "clave-segura-1",
      nombre: "María Rojas", ruc: "20123456789", razonSocial: "Empresa Real S.A.C."
    }).rol,
    "empresa"
  );
});

test("un correo repetido es rechazado", async () => {
  const repo = repositorioEnMemoria();
  const registrar = crearRegistrarUsuario({
    usuariosRepository: repo,
    tokens: crearServicioTokens({ secreto: SECRETO })
  });

  await registrar(estudiante);
  await assert.rejects(registrar(estudiante), CuentaDuplicadaError);
});

async function entornoLogin() {
  const repo = repositorioEnMemoria();
  const tokens = crearServicioTokens({ secreto: SECRETO });
  await crearRegistrarUsuario({ usuariosRepository: repo, tokens })(estudiante);
  const limitador = crearLimitadorIntentos({ maximo: 3 });

  return {
    repo,
    tokens,
    limitador,
    iniciar: crearIniciarSesion({ usuariosRepository: repo, tokens, limitador })
  };
}

test("inicia sesión con credenciales correctas (sin importar mayúsculas del correo)", async () => {
  const { iniciar, tokens } = await entornoLogin();
  const { usuario, token } = await iniciar({
    correo: "ANA@unsch.edu.pe",
    clave: "clave-segura-1"
  });

  assert.equal(usuario.correo, "ana@unsch.edu.pe");
  assert.equal("hashClave" in usuario, false);
  assert.equal(tokens.verificar(token).rol, "estudiante");
});

test("clave incorrecta, correo inexistente y cuenta inactiva dan el mismo error", async () => {
  const { iniciar, repo } = await entornoLogin();

  await assert.rejects(
    iniciar({ correo: "ana@unsch.edu.pe", clave: "mala-clave-99" }),
    CredencialesInvalidasError
  );
  await assert.rejects(
    iniciar({ correo: "nadie@unsch.edu.pe", clave: "clave-segura-1" }),
    CredencialesInvalidasError
  );

  repo.filas[0].activo = false;
  await assert.rejects(
    iniciar({ correo: "ana@unsch.edu.pe", clave: "clave-segura-1" }),
    CredencialesInvalidasError
  );
  await assert.rejects(iniciar(undefined), CredencialesInvalidasError);
});

test("bloquea tras demasiados intentos fallidos y no se salta con la clave correcta", async () => {
  const { iniciar } = await entornoLogin();
  const mal = { correo: "ana@unsch.edu.pe", clave: "mala-clave-99" };

  for (let i = 0; i < 3; i++) {
    await assert.rejects(iniciar(mal), CredencialesInvalidasError);
  }

  await assert.rejects(iniciar(mal), DemasiadosIntentosError);
  await assert.rejects(
    iniciar({ correo: "ana@unsch.edu.pe", clave: "clave-segura-1" }),
    DemasiadosIntentosError
  );
});

test("el bloqueo expira y un acierto reinicia el contador", async () => {
  let ahora = 0;
  const limitador = crearLimitadorIntentos({ maximo: 2, ventanaMs: 1000, ahora: () => ahora });

  limitador.registrarFallo("a");
  limitador.registrarFallo("a");
  assert.equal(limitador.bloqueado("a"), true);

  ahora = 1001;
  assert.equal(limitador.bloqueado("a"), false);

  limitador.registrarFallo("a");
  limitador.reiniciar("a");
  limitador.registrarFallo("a");
  assert.equal(limitador.bloqueado("a"), false);
});

test("obtiene el perfil sin hash y devuelve null si no existe o está inactivo", async () => {
  const { repo } = await entornoLogin();
  const perfil = crearObtenerPerfil({ usuariosRepository: repo });

  assert.equal((await perfil("1")).correo, "ana@unsch.edu.pe");
  assert.equal("hashClave" in (await perfil("1")), false);
  assert.equal(await perfil("99"), null);

  repo.filas[0].activo = false;
  assert.equal(await perfil("1"), null);
});

test("crea coordinador solo con la función administrativa", async () => {
  const repo = repositorioEnMemoria();
  const crear = crearCrearCoordinador({ usuariosRepository: repo });
  const usuario = await crear({
    correo: "Coord@unsch.edu.pe",
    clave: "clave-segura-1",
    nombre: "Coordinador Prácticas"
  });

  assert.equal(usuario.rol, "coordinador");
  assert.equal(usuario.correo, "coord@unsch.edu.pe");
  await assert.rejects(crear({ correo: "x@y.pe", clave: "corta", nombre: "Ok" }), DatosInvalidosError);
});
