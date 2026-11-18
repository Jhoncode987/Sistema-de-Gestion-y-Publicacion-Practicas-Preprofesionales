// EQ-03 (AC02 Seguridad): matriz de 50 accesos no autorizados y 25 controles autorizados.
// Se ejecuta contra el backend en marcha (ver pruebas/README.md):
//   node pruebas/seguridad/matriz-seguridad.cjs
// Variables: BASE_URL (http://localhost:3000), COORD_CORREO y COORD_CLAVE (cuenta de coordinador existente).
// Crea sus propias cuentas y datos (con sufijo único) y comprueba al final que los accesos
// denegados no cambiaron nada. Resultado en pruebas/k6/resultados/eq03-matriz.json y .md.
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const COORD_CORREO = process.env.COORD_CORREO;
const COORD_CLAVE = process.env.COORD_CLAVE;
const CARPETA = path.join(__dirname, "..", "k6", "resultados");
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

if (!COORD_CORREO || !COORD_CLAVE) {
  console.error("Define COORD_CORREO y COORD_CLAVE (coordinador existente). Ver pruebas/README.md.");
  process.exit(1);
}

async function http(token, metodo, ruta, cuerpo, { esquema = "Bearer", pdf = false } = {}) {
  const cabeceras = {};

  if (token) cabeceras.Authorization = `${esquema} ${token}`;
  if (pdf) cabeceras["Content-Type"] = "application/pdf";
  else if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";

  const r = await fetch(`${BASE}/api/v1${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: pdf ? cuerpo : cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
  });
  const texto = await r.text();
  let json = null;

  try {
    json = JSON.parse(texto);
  } catch {
    json = null;
  }

  return { estado: r.status, json, texto };
}

const unico = String(Date.now()).slice(-8);
const aleatorio = (n) => String(Math.floor(Math.random() * 10 ** n)).padStart(n, "0");
const clave = "ClaveSegura-2026";

async function registrar(datos) {
  const r = await http(null, "POST", "/auth/registro", { clave, ...datos });

  if (r.estado !== 201) throw new Error(`No se pudo registrar ${datos.correo}: ${r.estado} ${r.texto}`);

  return { token: r.json.token, id: r.json.usuario.id };
}

async function preparar() {
  const login = await http(null, "POST", "/auth/login", { correo: COORD_CORREO, clave: COORD_CLAVE });

  if (login.estado !== 200) throw new Error(`Login del coordinador falló: ${login.estado} ${login.texto}`);

  const cuentas = { coord: { token: login.json.token, id: login.json.usuario.id } };
  const empresa = (n) => ({
    correo: `empresa${n}-${unico}@seguridad.test`, nombre: `Empresa ${n}`,
    rol: "empresa", ruc: `2${unico}${aleatorio(2)}`.slice(0, 11).padEnd(11, "0"),
    razonSocial: `Empresa de seguridad ${n} S.A.C.`
  });
  const estudiante = (n) => ({
    correo: `est${n}-${unico}@unsch.edu.pe`, nombre: `Estudiante ${n}`, rol: "estudiante",
    codigoEstudiante: `7${aleatorio(7)}`, carrera: "Ingeniería de Sistemas", ciclo: 8, creditosAprobados: 200
  });

  const datosEmpresaA = empresa("A");
  const datosEmpresaB = empresa("B");
  cuentas.empA = { ...(await registrar(datosEmpresaA)), ruc: datosEmpresaA.ruc };
  cuentas.empB = { ...(await registrar(datosEmpresaB)), ruc: datosEmpresaB.ruc };
  cuentas.estA = await registrar(estudiante("A"));
  cuentas.estB = await registrar(estudiante("B"));

  const limite = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const nuevaOferta = (titulo) => ({
    titulo, descripcion: "Oferta para la matriz de seguridad", carrera: "Ingeniería de Sistemas",
    ciclo_minimo: 1, creditos_minimos: 160, modalidad: "remota", vacantes: 5, fecha_limite: limite
  });
  const ofA = await http(cuentas.empA.token, "POST", "/ofertas", nuevaOferta("Oferta A"));
  const ofB = await http(cuentas.empB.token, "POST", "/ofertas", nuevaOferta("Oferta B"));

  if (ofA.estado !== 201 || ofB.estado !== 201) throw new Error("No se pudieron crear las ofertas de prueba");

  const ids = { ofertaA: String(ofA.json.id), ofertaB: String(ofB.json.id) };
  const pend = await http(cuentas.coord.token, "GET", "/coordinacion/pendientes");
  const empresaDe = (ruc) => pend.json.empresas.find((e) => e.ruc === ruc);

  ids.empresaA = String(empresaDe(cuentas.empA.ruc).id);
  ids.empresaB = String(empresaDe(cuentas.empB.ruc).id);

  for (const [metodo, ruta] of [
    ["POST", `/coordinacion/empresas/${ids.empresaA}/aprobar`],
    ["POST", `/coordinacion/empresas/${ids.empresaB}/aprobar`],
    ["POST", `/coordinacion/ofertas/${ids.ofertaA}/aprobar`],
    ["POST", `/coordinacion/ofertas/${ids.ofertaB}/aprobar`]
  ]) {
    const r = await http(cuentas.coord.token, metodo, ruta);
    if (r.estado !== 200) throw new Error(`Preparación falló en ${ruta}: ${r.estado} ${r.texto}`);
  }

  for (const est of [cuentas.estA, cuentas.estB]) {
    const sube = await http(est.token, "PUT", "/auth/reporte-notas", PDF, { pdf: true });
    const verifica = await http(cuentas.coord.token, "PUT", `/auth/estudiantes/${est.id}/verificacion`, { creditos: 200 });
    if (sube.estado !== 200 || verifica.estado !== 200) throw new Error("No se pudo verificar a los estudiantes de prueba");
  }

  return { cuentas, ids };
}

const CLAVES_PROTEGIDAS = ["items", "usuario", "postulacion", "empresas", "ofertas", "estudiante", "oferta"];

function sinDatos(json) {
  return json === null || typeof json !== "object" || !CLAVES_PROTEGIDAS.some((k) => k in json);
}

async function foto(c, ids) {
  const coord = await http(c.coord.token, "GET", "/postulaciones/coordinacion");
  const mias = await http(c.empA.token, "GET", "/ofertas/mias");
  const miasB = await http(c.empB.token, "GET", "/ofertas/mias");
  const yo = await http(c.estA.token, "GET", "/auth/yo");
  const lista = await http(c.coord.token, "GET", "/auth/estudiantes?estado=todos");

  return JSON.stringify({
    resumen: coord.json?.resumen,
    ofertasA: mias.json?.items.map((o) => [o.id, o.estado]),
    ofertasB: miasB.json?.items.map((o) => [o.id, o.estado]),
    creditosA: [yo.json?.usuario.creditosAprobados, yo.json?.usuario.creditosVerificados],
    estudiantes: lista.json?.total
  });
}

async function principal() {
  const { cuentas: c, ids } = await preparar();
  const estado = {};
  const resultados = [];
  const T = (cuenta) => (cuenta ? c[cuenta].token : null);

  async function caso(id, tipo, descripcion, cuenta, metodo, ruta, cuerpo, esperado, opciones) {
    const rutaFinal = typeof ruta === "function" ? ruta() : ruta;
    const cuerpoFinal = typeof cuerpo === "function" ? cuerpo() : cuerpo;
    const r = await http(opciones?.token !== undefined ? opciones.token : T(cuenta), metodo, rutaFinal, cuerpoFinal, opciones);
    const permitidos = Array.isArray(esperado) ? esperado : [esperado];
    const estadoOk = permitidos.includes(r.estado);
    const datosOk = tipo === "valido" ? true : sinDatos(r.json);

    resultados.push({
      id, tipo, descripcion, cuenta: cuenta ?? "sin sesión", solicitud: `${metodo} ${rutaFinal}`,
      esperado: permitidos.join("/"), obtenido: r.estado, correcto: estadoOk && datosOk,
      datosExpuestos: !datosOk
    });

    return r;
  }

  // ---- 25 controles autorizados (en orden: crean el estado que usan los accesos denegados)
  const V = (...a) => caso(...a.slice(0, 1), "valido", ...a.slice(1));
  await V("V01", "Estudiante consulta su sesión", "estA", "GET", "/auth/yo", undefined, 200);
  await V("V02", "Estudiante busca ofertas", "estA", "GET", "/ofertas?carrera=Ingenier%C3%ADa%20de%20Sistemas", undefined, 200);
  await V("V03", "Estudiante lee filtros", "estA", "GET", "/ofertas/filtros", undefined, 200);
  await V("V04", "Estudiante actualiza su perfil académico", "estA", "PUT", "/auth/perfil-academico",
    { carrera: "Ingeniería de Sistemas", ciclo: 8, creditosAprobados: 200 }, 200);
  const pa = await V("V05", "Estudiante A postula a la oferta de A", "estA", "POST", "/postulaciones", { ofertaId: ids.ofertaA }, 201);
  estado.pA = String(pa.json?.id);
  await V("V06", "Estudiante lista sus postulaciones", "estA", "GET", "/postulaciones/mias", undefined, 200);
  await V("V07", "Empresa A lista sus ofertas", "empA", "GET", "/ofertas/mias", undefined, 200);
  await V("V08", "Empresa A ve los postulantes de su oferta", "empA", "GET", `/postulaciones/oferta/${ids.ofertaA}`, undefined, 200);
  await V("V09", "Coordinador ve pendientes", "coord", "GET", "/coordinacion/pendientes", undefined, 200);
  await V("V10", "Coordinador lista estudiantes", "coord", "GET", "/auth/estudiantes?estado=todos", undefined, 200);
  await V("V11", "Coordinador descarga el reporte de notas", "coord", "GET", `/auth/estudiantes/${c.estA.id}/reporte`, undefined, 200);
  await V("V12", "Coordinador ve postulaciones", "coord", "GET", "/postulaciones/coordinacion", undefined, 200);
  await V("V13", "Empresa A acepta a su postulante", "empA", "POST", () => `/postulaciones/${estado.pA}/aceptar`, undefined, 200);
  await V("V14", "Coordinador asigna docente asesor", "coord", "PUT", () => `/postulaciones/${estado.pA}/asesor`, { nombre: "Dr. Juan Pérez" }, 200);
  const pb = await V("V15", "Estudiante B postula a la oferta de A", "estB", "POST", "/postulaciones", { ofertaId: ids.ofertaA }, 201);
  estado.pB = String(pb.json?.id);
  await V("V16", "Empresa A rechaza a su postulante", "empA", "POST", () => `/postulaciones/${estado.pB}/rechazar`, { motivo: "No cumple" }, 200);
  const pb2 = await V("V17", "Estudiante B postula a la oferta de B", "estB", "POST", "/postulaciones", { ofertaId: ids.ofertaB }, 201);
  estado.pB2 = String(pb2.json?.id);
  await V("V18", "Estudiante B retira su postulación", "estB", "POST", () => `/postulaciones/${estado.pB2}/retirar`, undefined, 200);
  const nueva = await V("V19", "Empresa B publica otra oferta", "empB", "POST", "/ofertas", {
    titulo: "Oferta B2", descripcion: "Segunda oferta para la matriz de seguridad", carrera: "Ingeniería de Sistemas", ciclo_minimo: 1,
    creditos_minimos: 160, modalidad: "presencial", vacantes: 2,
    fecha_limite: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10)
  }, 201);
  await V("V20", "Empresa B cierra su oferta", "empB", "POST", `/ofertas/${nueva.json?.id}/cerrar`, undefined, 200);
  await V("V21", "Coordinador consulta su sesión", "coord", "GET", "/auth/yo", undefined, 200);
  await V("V22", "Empresa A consulta su sesión", "empA", "GET", "/auth/yo", undefined, 200);
  await V("V23", "Empresa A finaliza la práctica", "empA", "POST", () => `/postulaciones/${estado.pA}/finalizar`, undefined, 200);
  await V("V24", "Coordinador verifica créditos de B", "coord", "PUT", `/auth/estudiantes/${c.estB.id}/verificacion`, { creditos: 200 }, 200);
  await V("V25", "Empresa B busca ofertas", "empB", "GET", "/ofertas", undefined, 200);

  const antes = await foto(c, ids);

  // ---- 50 accesos no autorizados
  const I = (id, desc, cuenta, metodo, ruta, cuerpo, esperado, opciones) =>
    caso(id, "denegado", desc, cuenta, metodo, ruta, cuerpo, esperado, opciones);
  const pA = () => estado.pA;
  const oA = ids.ofertaA;
  const oB = ids.ofertaB;

  // Sin credenciales: 401
  await I("I01", "Sin sesión: buscar ofertas", null, "GET", "/ofertas", undefined, 401);
  await I("I02", "Sin sesión: ofertas de empresa", null, "GET", "/ofertas/mias", undefined, 401);
  await I("I03", "Sin sesión: publicar oferta", null, "POST", "/ofertas", {}, 401);
  await I("I04", "Sin sesión: ver sesión", null, "GET", "/auth/yo", undefined, 401);
  await I("I05", "Sin sesión: cambiar perfil", null, "PUT", "/auth/perfil-academico", {}, 401);
  await I("I06", "Sin sesión: listar estudiantes", null, "GET", "/auth/estudiantes", undefined, 401);
  await I("I07", "Sin sesión: verificar créditos", null, "PUT", `/auth/estudiantes/${c.estA.id}/verificacion`, { creditos: 250 }, 401);
  await I("I08", "Sin sesión: pendientes de coordinación", null, "GET", "/coordinacion/pendientes", undefined, 401);
  await I("I09", "Sin sesión: aprobar oferta", null, "POST", `/coordinacion/ofertas/${oA}/aprobar`, undefined, 401);
  await I("I10", "Sin sesión: postular", null, "POST", "/postulaciones", { ofertaId: oA }, 401);
  await I("I11", "Sin sesión: mis postulaciones", null, "GET", "/postulaciones/mias", undefined, 401);
  await I("I12", "Sin sesión: aceptar postulación", null, "POST", () => `/postulaciones/${pA()}/aceptar`, undefined, 401);
  await I("I13", "Sin sesión: asignar asesor", null, "PUT", () => `/postulaciones/${pA()}/asesor`, { nombre: "Intruso" }, 401);
  await I("I14", "Sin sesión: ver todas las postulaciones", null, "GET", "/postulaciones/coordinacion", undefined, 401);

  // Token inválido, alterado o de otro tipo: 401
  const tokenEst = c.estA.token;
  const [cab, carga, firma] = tokenEst.split(".");
  const cargaAlterada = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(carga, "base64url")), rol: "coordinador" })).toString("base64url");
  await I("I15", "Token inventado", null, "GET", "/ofertas", undefined, 401, { token: "abc.def.ghi" });
  await I("I16", "Token con firma alterada", null, "GET", "/ofertas", undefined, 401, { token: `${cab}.${carga}.${firma.slice(0, -2)}xx` });
  await I("I17", "Token de estudiante con rol cambiado a coordinador", null, "GET", "/coordinacion/pendientes", undefined, 401, { token: `${cab}.${cargaAlterada}.${firma}` });
  await I("I18", "Esquema de autorización distinto de Bearer", null, "GET", "/ofertas", undefined, 401, { token: tokenEst, esquema: "Basic" });

  // Estudiante en rutas de otros roles: 403
  await I("I19", "Estudiante: pendientes de coordinación", "estA", "GET", "/coordinacion/pendientes", undefined, 403);
  await I("I20", "Estudiante: aprobar empresa", "estA", "POST", `/coordinacion/empresas/${ids.empresaA}/aprobar`, undefined, 403);
  await I("I21", "Estudiante: aprobar oferta", "estA", "POST", `/coordinacion/ofertas/${oB}/aprobar`, undefined, 403);
  await I("I22", "Estudiante: cerrar oferta como coordinación", "estA", "POST", `/coordinacion/ofertas/${oB}/cerrar`, { motivo: "Intruso" }, 403);
  await I("I23", "Estudiante: publicar oferta", "estA", "POST", "/ofertas", {}, 403);
  await I("I24", "Estudiante: ofertas de empresa", "estA", "GET", "/ofertas/mias", undefined, 403);
  await I("I25", "Estudiante: listar estudiantes", "estA", "GET", "/auth/estudiantes", undefined, 403);
  await I("I26", "Estudiante: verificarse sus propios créditos", "estA", "PUT", `/auth/estudiantes/${c.estA.id}/verificacion`, { creditos: 250 }, 403);
  await I("I27", "Estudiante: asignarse asesor", "estA", "PUT", () => `/postulaciones/${pA()}/asesor`, { nombre: "Intruso" }, 403);
  await I("I28", "Estudiante: ver todas las postulaciones", "estA", "GET", "/postulaciones/coordinacion", undefined, 403);
  await I("I29", "Estudiante: finalizar una práctica", "estA", "POST", () => `/postulaciones/${pA()}/finalizar`, undefined, 403);

  // Empresa en rutas de otros roles: 403
  await I("I30", "Empresa: postular", "empA", "POST", "/postulaciones", { ofertaId: oB }, 403);
  await I("I31", "Empresa: mis postulaciones", "empA", "GET", "/postulaciones/mias", undefined, 403);
  await I("I32", "Empresa: perfil académico", "empA", "PUT", "/auth/perfil-academico", { carrera: "X", ciclo: 1, creditosAprobados: 1 }, 403);
  await I("I33", "Empresa: subir reporte de notas", "empA", "PUT", "/auth/reporte-notas", PDF, 403, { pdf: true });
  await I("I34", "Empresa: pendientes de coordinación", "empA", "GET", "/coordinacion/pendientes", undefined, 403);
  await I("I35", "Empresa: autoaprobarse", "empA", "POST", `/coordinacion/empresas/${ids.empresaA}/aprobar`, undefined, 403);
  await I("I36", "Empresa: autoaprobar una oferta", "empB", "POST", `/coordinacion/ofertas/${oB}/aprobar`, undefined, 403);
  await I("I37", "Empresa: listar estudiantes", "empA", "GET", "/auth/estudiantes", undefined, 403);
  await I("I38", "Empresa: verificar créditos", "empA", "PUT", `/auth/estudiantes/${c.estB.id}/verificacion`, { creditos: 250 }, 403);
  await I("I39", "Empresa: asignar asesor", "empA", "PUT", () => `/postulaciones/${pA()}/asesor`, { nombre: "Intruso" }, 403);
  await I("I40", "Empresa: retirar una postulación de estudiante", "empA", "POST", () => `/postulaciones/${estado.pB2}/retirar`, undefined, 403);

  // Propiedad: recursos de otra cuenta (403 o 404, sin revelar ni cambiar nada)
  await I("I41", "Empresa B: cerrar la oferta de A", "empB", "POST", `/ofertas/${oA}/cerrar`, undefined, [403, 404]);
  await I("I42", "Empresa B: ver postulantes de la oferta de A", "empB", "GET", `/postulaciones/oferta/${oA}`, undefined, [403, 404]);
  await I("I43", "Empresa B: aceptar postulación de la oferta de A", "empB", "POST", () => `/postulaciones/${estado.pB}/aceptar`, undefined, [403, 404]);
  await I("I44", "Empresa B: finalizar práctica de la oferta de A", "empB", "POST", () => `/postulaciones/${pA()}/finalizar`, undefined, [403, 404]);
  await I("I45", "Estudiante B: retirar postulación de A", "estB", "POST", () => `/postulaciones/${pA()}/retirar`, undefined, [403, 404]);
  await I("I46", "Estudiante A: descargar reporte de notas de B", "estA", "GET", `/auth/estudiantes/${c.estB.id}/reporte`, undefined, 403);

  // Escalada de privilegios y datos inválidos
  await I("I47", "Registro propio como coordinador", null, "POST", "/auth/registro", {
    correo: `intruso1-${unico}@unsch.edu.pe`, clave, nombre: "Intruso", rol: "coordinador" }, 400);
  await I("I48", "Registro con rol inventado", null, "POST", "/auth/registro", {
    correo: `intruso2-${unico}@unsch.edu.pe`, clave, nombre: "Intruso", rol: "administrador" }, 400);
  await I("I49", "Estudiante: créditos fuera de rango", "estA", "PUT", "/auth/perfil-academico",
    { carrera: "Ingeniería de Sistemas", ciclo: 8, creditosAprobados: 9999 }, 400);
  await I("I50", "Estudiante con correo no institucional", null, "POST", "/auth/registro", {
    correo: `intruso3-${unico}@gmail.com`, clave, nombre: "Intruso", rol: "estudiante", codigoEstudiante: "70000001",
    carrera: "Ingeniería de Sistemas", ciclo: 8, creditosAprobados: 200 }, 400);

  const despues = await foto(c, ids);
  const sinCambios = antes === despues;

  const invalidos = resultados.filter((r) => r.tipo === "denegado");
  const validos = resultados.filter((r) => r.tipo === "valido");
  const rechazados = invalidos.filter((r) => r.correcto).length;
  const exitosos = validos.filter((r) => r.correcto).length;
  const expuestos = invalidos.filter((r) => r.datosExpuestos).length;
  const resumen = {
    fecha: new Date().toISOString(), baseUrl: BASE,
    accesosInvalidosRechazados: `${rechazados}/${invalidos.length}`,
    controlesValidosExitosos: `${exitosos}/${validos.length}`,
    datosProtegidosExpuestos: expuestos,
    escriturasIndebidas: sinCambios ? 0 : "hay cambios (ver foto antes/después)",
    cumple: rechazados === 50 && exitosos === 25 && expuestos === 0 && sinCambios
  };

  fs.mkdirSync(CARPETA, { recursive: true });
  fs.writeFileSync(path.join(CARPETA, "eq03-matriz.json"), JSON.stringify({ resumen, antes: JSON.parse(antes), despues: JSON.parse(despues), resultados }, null, 2));

  const filas = resultados.map((r) =>
    `| ${r.id} | ${r.tipo === "valido" ? "Autorizado" : "Denegado"} | ${r.cuenta} | ${r.descripcion} | \`${r.solicitud}\` | ${r.esperado} | ${r.obtenido} | ${r.correcto ? "✔" : "✘"} |`
  );
  fs.writeFileSync(
    path.join(CARPETA, "eq03-matriz.md"),
    ["| ID | Tipo | Cuenta | Caso | Solicitud | Esperado | Obtenido | Resultado |", "|---|---|---|---|---|---|---|---|", ...filas, ""].join("\n")
  );

  for (const r of resultados.filter((x) => !x.correcto)) {
    console.log(`FALLA ${r.id}: ${r.descripcion} (${r.solicitud}) esperado ${r.esperado}, obtuvo ${r.obtenido}${r.datosExpuestos ? " con datos expuestos" : ""}`);
  }
  console.log(JSON.stringify(resumen, null, 2));
  process.exitCode = resumen.cumple ? 0 : 1;
}

principal().catch((e) => {
  console.error("Error en la matriz de seguridad:", e.message);
  process.exitCode = 1;
});
