# API REST propia con referencia funcional Bumeran

## Referencia y alcance

Se toman como referencia los flujos observables de empresas, avisos, candidatos y postulaciones. Las capacidades están documentadas en [publicación y gestión de candidatos](https://www.bumeran.com.pe/productos/talento/) y [seguimiento de postulaciones](https://www.bumeran.com.pe/blog/buscar-trabajo/que-hacer-despues-de-postular-a-un-empleo-en-bumeran/), consultados durante la revisión funcional del proyecto.

Las rutas siguientes son **propuestas de nuestro sistema UNSCH**, no endpoints oficiales de Bumeran. No se consume su API privada ni se atribuye a Bumeran nuestro stack técnico.

La API es la entrada del mismo backend monolítico. Conserva los siete módulos originales y PostgreSQL como única base. Los módulos no se llaman por HTTP entre sí.

## Correspondencia y operaciones

| Flujo funcional | Ruta propuesta | Módulo y permiso |
|---|---|---|
| Cuenta de candidato/empresa | POST /api/v1/usuarios | Usuarios y Autenticación: registro de estudiante/representante, sin autoasignación de roles institucionales. |
| Inicio de sesión | POST /api/v1/sesiones | Usuarios y Autenticación: verificar credenciales. |
| Perfil empresarial | POST /api/v1/empresas | Ofertas: registrar perfil pendiente vinculado a cuenta. Es un recurso HTTP, no un módulo nuevo. |
| Validación institucional propia | PATCH /api/v1/empresas/{id}/validacion | Ofertas: coordinador aprueba o rechaza empresa. |
| Publicación de aviso | POST /api/v1/ofertas | Ofertas: empresa validada envía oportunidad a revisión. |
| Revisión institucional propia | PATCH /api/v1/ofertas/{id}/validacion | Ofertas: coordinador decide publicación por separado. |
| Edición y cierre de aviso | PATCH /api/v1/ofertas/{id} | Ofertas: solo empresa propietaria; cambios de requisitos publicados vuelven a revisión. |
| Búsqueda de oportunidades | GET /api/v1/ofertas?modalidad=remota&page=1&pageSize=20 | Ofertas: filtrar por carrera/ciclo de la identidad autenticada y vigencia. |
| Postulación a aviso | POST /api/v1/postulaciones | Postulaciones: estudiante autenticado; cuerpo con ofertaId, identidad derivada de credenciales. |
| Mis postulaciones | GET /api/v1/me/postulaciones | Postulaciones: solo candidaturas propias. |
| Administración de candidatos | GET /api/v1/ofertas/{id}/postulaciones | Postulaciones: empresa propietaria o coordinador autorizado. |
| Evaluación empresarial | PATCH /api/v1/postulaciones/{id}/estado | Postulaciones: revisión, selección o rechazo por empresa propietaria. |
| Convenio institucional propio | POST /api/v1/convenios | Convenios: coordinador autorizado; requiere selección confirmada. |
| Seguimiento institucional propio | PATCH /api/v1/convenios/{id}/estado | Convenios: transiciones del documento. |
| Seguimiento de práctica propio | PATCH /api/v1/convenios/{id}/practica/estado | Convenios: transiciones de práctica separadas del documento. |
| Avisos internos propios | GET /api/v1/me/notificaciones | Notificaciones: solo avisos del destinatario. |
| Lectura de aviso propio | PATCH /api/v1/me/notificaciones/{id} | Notificaciones: destinatario marca lectura. |
| Reportes propios | GET /api/v1/reportes?periodo=2026-II&carrera=sistemas&formato=pdf | Reportes y Auditoría: permiso de reportes; json para dashboard, pdf o xlsx para exportación. |

El contrato académico es interno: Postulaciones llama a Integración Académica y esta usa el adaptador SIGA si se autoriza. No es una API de Bumeran.

## Respuestas y validación del backend

- HTTPS y JSON; los reportes exportados usan su tipo de archivo. Listados con items, page, pageSize y total; pageSize máximo 20.
- 200 para consulta/actualización; 201 para creación; 400 para formato inválido; 401 sin credenciales válidas; 403 sin permiso, propiedad o ámbito; 404 para recurso inexistente.
- 409 para duplicidad, transición inválida u oferta cerrada/cambiada concurrentemente.
- 422 si los requisitos académicos no se cumplen; 503 si una verificación necesaria no está disponible. No confundir no elegible con falla técnica.
- Error JSON con codigo, mensaje y correlationId; no exponer SQL ni secretos.
- Antes del registro: consultar oferta, validar elegibilidad y revalidar vigencia/requisitos dentro de la transacción por contrato de Ofertas.
- RF05 se protege mediante restricción única estudiante–oferta. Una ráfaga de 25 solicitudes idénticas crea una sola fila.
- Notificaciones y auditoría obligatorias se coordinan mediante la unidad de trabajo del mismo backend.

## Estado

El backend usa Node.js con Express 5 (ADR-006). Estado de implementación:

| Ruta | Estado | Observaciones |
|---|---|---|
| GET /api/v1/salud | Implementada | Comprobación de que el backend responde; no forma parte del contrato de negocio. |
| GET /api/v1/salud/db | Implementada | Diagnóstico de la conexión con PostgreSQL. |
| GET /api/v1/ofertas | Implementada de forma parcial | Ofertas publicadas, de empresas aprobadas y con fecha límite vigente. Filtros: `q` (título, empresa o descripción), `modalidad` (presencial, remota o hibrida), `carrera` y `ciclo` (ofertas con ciclo mínimo igual o menor). Paginación con `page` y `pageSize` (9 por defecto, máximo 50). Responde `{ items, page, pageSize, total }`. Requiere sesión iniciada (cualquier rol): el portal muestra primero el inicio de sesión y las ofertas aparecen al ingresar. Sin token responde 401 `NO_AUTENTICADO`. |
| GET /api/v1/ofertas/filtros | Implementada | Requiere sesión iniciada. Carreras con ofertas vigentes y modalidades disponibles, para llenar los filtros del portal. |
| POST /api/v1/auth/registro | Implementada | Crea una cuenta institucional de estudiante (`codigoEstudiante`; el correo debe ser `@unsch.edu.pe`) o una cuenta de empresa (`ruc`, `razonSocial`; correo libre) y devuelve `{ usuario, token }` con 201. El coordinador no se registra aquí. Errores: 400 `DATOS_INVALIDOS`, 409 `CUENTA_DUPLICADA`. |
| POST /api/v1/auth/login | Implementada | Recibe `{ correo, clave }` y devuelve `{ usuario, token }`. Errores: 401 `CREDENCIALES_INVALIDAS` (mismo mensaje para correo inexistente, clave incorrecta o cuenta inactiva) y 429 `DEMASIADOS_INTENTOS`. |
| GET /api/v1/auth/yo | Implementada | Con `Authorization: Bearer <token>` devuelve `{ usuario }`; 401 `NO_AUTENTICADO` si falta o venció. |
| POST /api/v1/ofertas | Implementada | Solo rol empresa. Recibe `titulo`, `descripcion`, `carrera`, `ciclo_minimo` (1 a 10), `creditos_minimos`, `modalidad`, `vacantes` (1 a 100) y `fecha_limite` (AAAA-MM-DD, posterior a hoy y máximo 365 días). Responde 201 con la oferta en estado `pendiente_revision`; la empresa se toma de la cuenta, nunca del cuerpo. Errores: 400 `DATOS_INVALIDOS`, 403 `ACCESO_DENEGADO`, 409 `RUC_EN_USO`. |
| GET /api/v1/ofertas/mias | Implementada | Solo rol empresa. Devuelve `{ empresa: { razonSocial, ruc, estado }, items }` con todas sus ofertas, en cualquier estado. |
| Resto de rutas de la tabla | Pendientes | |

**Diferencias actuales con el contrato propuesto** (por alinear cuando se amplíe el módulo):

- Los errores actuales son `{ codigo, mensaje }` con 400 (`PARAMETROS_INVALIDOS`) o 503 (`SERVICIO_NO_DISPONIBLE`); falta `correlationId` y los códigos 401, 403, 404, 409 y 422, que dependen de funciones aún no implementadas.
- RF03 se cumple de forma parcial: el estudiante elige su carrera y ciclo en los filtros. Ya existe autenticación, pero la carrera y el ciclo todavía no forman parte del perfil: cuando se integre la elegibilidad con SIGA (RC02), saldrán de la identidad y no de la URL.

Pendientes: OpenAPI y pruebas. Un cambio de adaptador conserva estos contratos mientras no cambie el comportamiento del negocio (AC03).
