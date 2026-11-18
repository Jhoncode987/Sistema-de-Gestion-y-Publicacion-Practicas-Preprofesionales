# Especificaciones SDD de las funcionalidades implementadas

Sprint 2, actividad 3. Cada especificación se escribió antes de dar por terminada la funcionalidad y define qué debe cumplir (criterios de aceptación) y qué trabajo técnico la implementa. Los criterios usan el formato *Dado / Cuando / Entonces* y la columna de verificación indica si lo comprueba una prueba automática, una medición con k6 o una comprobación manual. Lo que no está automatizado se dice expresamente.

Funcionalidades del Sprint 1 que **no** se implementaron en esta versión: notificaciones (RF07, HU-07), registro de auditoría completo (RF09; solo se guarda quién decidió y cuándo), reportes exportables (RF10, HU-09), convenios (HU-06), edición de ofertas y el rol Administrador. Quedan como trabajo futuro en [estado-y-trabajo-futuro.md](../02-arquitectura/estado-y-trabajo-futuro.md).

Las rutas se describen en [`backend/openapi.yaml`](../../backend/openapi.yaml). Las decisiones que sustentan estas reglas están en [decisiones-arquitectonicas.md](../02-arquitectura/decisiones-arquitectonicas.md).

---

## SDD-01 — Registro e inicio de sesión con roles

**Trazabilidad:** RF08, RF01 (cuenta de empresa), HU-01. ADR-008.

**Descripción.** Una persona crea una cuenta de estudiante o de empresa e inicia sesión. El sistema emite un token con el rol, y cada ruta protegida comprueba rol y propiedad. El coordinador no se registra desde la web.

**Reglas.** Estudiante: correo `@unsch.edu.pe`, código de 6 a 10 dígitos, carrera, ciclo (1–10) y créditos (0–250). Empresa: RUC de 11 dígitos y razón social. Clave de 8 a 128 caracteres, guardada con hash. Token de 8 horas. Mismo mensaje de error para correo inexistente o clave incorrecta, y límite de intentos fallidos.

**Criterios de aceptación**

| ID | Criterio | Verificación |
|---|---|---|
| CA-01.1 | Dado un estudiante con correo institucional y datos válidos, cuando se registra, entonces recibe 201, un token y su perfil sin la clave. | `identidad.test.cjs` |
| CA-01.2 | Dado un estudiante con correo no institucional, cuando se registra, entonces recibe 400. | `identidad.test.cjs`, matriz EQ-03 (I50) |
| CA-01.3 | Dado que se pide el rol `coordinador` o uno inventado, cuando se registra, entonces recibe 400 y no se crea cuenta. | `identidad.test.cjs`, matriz EQ-03 (I47, I48) |
| CA-01.4 | Dado un correo, código o RUC ya usado, cuando se registra, entonces recibe 409 `CUENTA_DUPLICADA`. | `identidad.test.cjs` |
| CA-01.5 | Dadas credenciales incorrectas, cuando inicia sesión, entonces recibe 401 con el mismo mensaje para correo inexistente y clave incorrecta. | `identidad.test.cjs` |
| CA-01.6 | Dados varios intentos fallidos seguidos, cuando se repite, entonces recibe 429. | `identidad.test.cjs` |
| CA-01.7 | Dado un token ausente, alterado o de otro esquema, cuando se llama a una ruta protegida, entonces recibe 401 sin datos. | matriz EQ-03 (I01–I18) |

**Tareas técnicas**

- [x] Migración 003 (usuarios) y 004 (vínculo empresa–usuario).
- [x] Caso de uso `registrarUsuario`, `iniciarSesion`, servicio de tokens HS256 y hash de claves con `node:crypto`.
- [x] Middleware `autenticar` y `requerirRol`; rutas `/auth/registro`, `/auth/login`, `/auth/yo`.
- [x] Script `crear-coordinador.cjs` para la única vía de crear coordinadores.
- [x] Pantalla de acceso y sesión en el portal.

---

## SDD-02 — Perfil académico y verificación de créditos

**Trazabilidad:** RF04 (parcial, hasta integrar SIGA), RC02. Norma de la Escuela (160 créditos). ADR-009, ADR-010 y ADR-011.

**Descripción.** El estudiante declara su perfil y sube su reporte de notas en PDF. La coordinación lo revisa, suma los créditos y registra el total. Solo los créditos verificados permiten postular.

**Criterios de aceptación**

| ID | Criterio | Verificación |
|---|---|---|
| CA-02.1 | Dado un estudiante, cuando sube un PDF de hasta 2 MB, entonces se guarda como su reporte vigente. | `verificacion-creditos.test.cjs` |
| CA-02.2 | Dado un archivo que no es PDF, vacío o mayor de 2 MB, cuando se sube, entonces recibe 400 y no se guarda. | `verificacion-creditos.test.cjs` |
| CA-02.3 | Dado un coordinador y un estudiante con reporte, cuando registra un total de 0 a 250, entonces el estudiante queda verificado con quién y cuándo. | `verificacion-creditos.test.cjs`; la consulta SQL se comprobó a mano en PostgreSQL |
| CA-02.4 | Dado un estudiante sin reporte, cuando el coordinador intenta verificarlo, entonces recibe 404. | `verificacion-creditos.test.cjs` |
| CA-02.5 | Dado un estudiante verificado, cuando cambia sus créditos declarados, entonces pierde la verificación; si guarda los mismos, la conserva. | comprobado a mano en PostgreSQL (consulta de perfil); sin prueba automática |
| CA-02.6 | Dado un estudiante o empresa, cuando intenta verificar créditos o descargar un reporte ajeno, entonces recibe 403 sin datos. | `verificacion-creditos.test.cjs`, matriz EQ-03 (I25, I26, I37, I38, I46) |
| CA-02.7 | Dado un estudiante con créditos verificados menores a 160, cuando abre el portal, entonces ve cuántos le faltan. | prueba manual |

**Tareas técnicas**

- [x] Migración 007 (perfil académico) y 012 (verificación y tabla de reportes con límite de tamaño).
- [x] Casos de uso `subirReporteNotas`, `listarEstudiantes`, `obtenerReporteNotas`, `verificarCreditos`; rol comprobado contra la base.
- [x] Subida como cuerpo binario `application/pdf` (sin dependencias nuevas).
- [x] Sección "Verificación de créditos" del coordinador y estado en el panel del estudiante.

---

## SDD-03 — Publicación de ofertas

**Trazabilidad:** RF02, HU-03. Norma: mínimo de 160 créditos.

**Descripción.** Una empresa publica una oferta que queda pendiente hasta que la coordinación la apruebe. La empresa se toma de la cuenta, nunca del cuerpo de la solicitud.

**Reglas.** Título, descripción, carrera, ciclo mínimo (1–10), créditos mínimos (160–250, 160 por defecto), modalidad (presencial, remota o híbrida), vacantes (1–100) y fecha límite posterior a hoy y a no más de 365 días.

| ID | Criterio | Verificación |
|---|---|---|
| CA-03.1 | Dada una empresa autenticada y datos válidos, cuando publica, entonces recibe 201 y la oferta en `pendiente_revision`. | `publicar-oferta.test.cjs` |
| CA-03.2 | Dada una oferta con créditos menores a 160 o mayores a 250, cuando se publica, entonces recibe 400. | `publicar-oferta.test.cjs` |
| CA-03.3 | Dada una oferta con fecha pasada, de más de 365 días, modalidad inválida o vacantes fuera de rango, cuando se publica, entonces recibe 400. | `publicar-oferta.test.cjs` |
| CA-03.4 | Dado un estudiante o coordinador, cuando intenta publicar, entonces recibe 403. | matriz EQ-03 (I23) |
| CA-03.5 | Dada una empresa, cuando cierra una oferta ajena, entonces recibe 404 y la oferta no cambia. | matriz EQ-03 (I41) |

**Tareas técnicas**

- [x] Migraciones 001, 002 (índices) y 010 (piso de 160 créditos con restricción en la base).
- [x] Caso de uso `publicarOferta` con validación y constante institucional `CREDITOS_MINIMOS_PRACTICAS`.
- [x] Panel de empresa con formulario y listado de sus ofertas.

---

## SDD-04 — Búsqueda de ofertas

**Trazabilidad:** RF03 (parcial), HU-04, DA02. Escenario EQ-01.

**Descripción.** El estudiante busca ofertas publicadas y vigentes con filtros y paginación. La carrera y el ciclo se eligen en los filtros (la derivación automática desde el perfil queda pendiente).

| ID | Criterio | Verificación |
|---|---|---|
| CA-04.1 | Dado cualquier usuario autenticado, cuando consulta, entonces solo ve ofertas `publicada`, de empresas `aprobada` y con fecha límite vigente. | `ofertas.repository.test.cjs`, k6 EQ-01 (cero ofertas incorrectas) |
| CA-04.2 | Dados filtros de modalidad, carrera, ciclo y texto, cuando consulta, entonces recibe solo ofertas que los cumplen, sin permitir inyección SQL. | `listar-ofertas.test.cjs`, `ofertas.repository.test.cjs` |
| CA-04.3 | Dado un `page` o `pageSize` inválido, cuando consulta, entonces recibe 400; el tamaño máximo es 50. | `listar-ofertas.test.cjs` |
| CA-04.4 | Dados 20 y 25 usuarios simultáneos, cuando buscan durante 10 minutos, entonces el p95 es ≤ 2 s y los fallos < 1 %. | k6 `eq01-busqueda.js` (ver informe de validación) |

**Tareas técnicas:** [x] consulta parametrizada con filtros; [x] respuesta `{ items, page, pageSize, total }`; [x] portal con filtros y paginación; [x] script k6.

---

## SDD-05 — Revisión institucional

**Trazabilidad:** RF01, RF09 (parcial), HU-02.

**Descripción.** El coordinador aprueba o rechaza empresas y ofertas por separado, y puede retirar una oferta publicada con un motivo. Se guarda quién decidió y cuándo. Las ofertas nunca se borran.

| ID | Criterio | Verificación |
|---|---|---|
| CA-05.1 | Dada una empresa pendiente, cuando el coordinador la aprueba o la rechaza (con motivo de 5 a 500 caracteres), entonces cambia de estado y queda quién y cuándo. | `revision.test.cjs` |
| CA-05.2 | Dada una oferta de una empresa no aprobada o vencida, cuando se intenta publicar, entonces recibe 409 `EMPRESA_NO_APROBADA` u `OFERTA_VENCIDA`. | `revision.test.cjs` |
| CA-05.3 | Dadas dos decisiones simultáneas sobre la misma entidad, cuando ocurren, entonces una recibe 409 `TRANSICION_INVALIDA`. | `revision.test.cjs` cubre "ya revisada → 409"; la atomicidad ante decisiones simultáneas la da la actualización SQL condicionada por estado (comprobada a mano, sin prueba automática) |
| CA-05.4 | Dada una oferta publicada, cuando el coordinador la cierra con motivo, entonces pasa a `cerrada` y la empresa ve el motivo. | `revision.test.cjs` |
| CA-05.5 | Dada una empresa o un estudiante, cuando intenta decidir, entonces recibe 403 (no hay autoaprobación). | matriz EQ-03 (I20, I21, I35, I36) |

**Tareas técnicas:** [x] casos de uso `listarPendientes`, `decidirEmpresa`, `decidirOferta`, `cerrarOferta`; [x] actualización atómica por estado; [x] panel del coordinador.

---

## SDD-06 — Postulación a una oferta

**Trazabilidad:** RF04, RF05, HU-05, DA02. Escenario EQ-02. ADR-009.

**Descripción.** El estudiante se postula a una oferta si cumple todos los requisitos. La unicidad y las vacantes se protegen en PostgreSQL.

**Reglas.** Créditos verificados; perfil completo; oferta vigente; carrera igual (sin importar tildes ni mayúsculas); ciclo y créditos suficientes (mínimo 160 o lo que pida la oferta); sin práctica aceptada; sin postulación previa a la misma oferta (una retirada no se repite).

| ID | Criterio | Verificación |
|---|---|---|
| CA-06.1 | Dado un estudiante elegible, cuando postula, entonces recibe 201 y la postulación queda `pendiente`. | `postulaciones.test.cjs` |
| CA-06.2 | Dados créditos sin verificar, perfil incompleto, oferta no vigente o requisitos no cumplidos, cuando postula, entonces recibe 409 con el código y los `motivos` correspondientes y no se crea fila. | `postulaciones.test.cjs` |
| CA-06.3 | Dado un estudiante con una práctica aceptada, cuando postula, entonces recibe 409 `YA_TIENE_PRACTICA`. | `postulaciones.test.cjs` |
| CA-06.4 | Dadas 25 solicitudes simultáneas de la misma cuenta a la misma oferta, cuando se envían, entonces hay 1 respuesta 201, 24 respuestas 409, ningún 5xx y una sola fila. | k6 `eq02-rafaga.js` |
| CA-06.5 | Dados 20 y 25 estudiantes distintos postulando a ofertas distintas, cuando lo hacen durante 10 minutos, entonces el p95 es ≤ 3 s y los fallos < 1 %. | k6 `eq02-postulacion.js` |
| CA-06.6 | Dado un estudiante, cuando retira una postulación pendiente, entonces queda `retirada`; no puede retirar la de otro. | `postulaciones.test.cjs`, matriz EQ-03 (I45) |

**Tareas técnicas:** [x] migración 008 con restricción única (oferta, estudiante); [x] función pura de elegibilidad; [x] caso de uso `postular` con candado por oferta y estudiante; [x] contratos de Ofertas hacia Postulaciones (sin tocar sus tablas); [x] vista "Mis postulaciones".

---

## SDD-07 — Decisión de la empresa, finalización y docente asesor

**Trazabilidad:** RF06, HU-08, norma de la Escuela (docente asesor). ADR-009 y ADR-010.

**Descripción.** La empresa dueña acepta o rechaza a sus postulantes. Al aceptar se controlan las vacantes. La empresa o la coordinación marca la práctica como finalizada, y la coordinación designa el docente asesor.

| ID | Criterio | Verificación |
|---|---|---|
| CA-07.1 | Dada una oferta con N vacantes y más de N aceptaciones simultáneas, cuando se aceptan, entonces se aceptan exactamente N. | `postulaciones.test.cjs` cubre el tope con un repositorio en memoria; la concurrencia real se comprobó a mano en PostgreSQL (5 aceptaciones simultáneas con 2 vacantes dieron 2) y no está automatizada |
| CA-07.2 | Dadas todas las vacantes cubiertas, cuando se acepta la última, entonces la oferta se cierra y las pendientes se rechazan con motivo. | `postulaciones.test.cjs` |
| CA-07.3 | Dado un estudiante aceptado, cuando otra empresa intenta aceptarlo, entonces recibe 409 `ESTUDIANTE_YA_ACEPTADO`; sus otras pendientes quedan retiradas. | `postulaciones.test.cjs` |
| CA-07.4 | Dada una empresa que no es dueña de la oferta, cuando intenta ver postulantes, aceptar o finalizar, entonces recibe 403 o 404 sin datos. | matriz EQ-03 (I42–I44) |
| CA-07.5 | Dada una postulación aceptada, cuando la empresa o el coordinador la finaliza, entonces pasa a `finalizada` y el estudiante puede postular de nuevo. | `postulaciones.test.cjs` |
| CA-07.6 | Dada una postulación aceptada, cuando el coordinador asigna docente asesor (3 a 120 caracteres), entonces queda guardado y visible para estudiante, empresa y coordinación; en otro estado recibe 409. | `postulaciones.test.cjs` |
| CA-07.7 | Dado un estudiante o una empresa, cuando intenta asignar asesor, entonces recibe 403. | matriz EQ-03 (I27, I39) |

**Tareas técnicas:** [x] migraciones 009 (finalizar) y 011 (asesor); [x] casos de uso `decidirPostulacion`, `finalizarPractica`, `asignarAsesor`, `verPostulacionesCoordinacion`; [x] paneles de empresa y de coordinación.
