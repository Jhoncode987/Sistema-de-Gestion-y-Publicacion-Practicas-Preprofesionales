# Requisitos funcionales

| ID | Requisito verificable |
|---|---|
| RF01 | Registrar el perfil de empresa en estado pendiente y permitir al coordinador aprobarlo o rechazarlo, registrando motivo y fecha. Una empresa no aprobada no puede enviar ofertas a publicación. Usuarios administra credenciales; el módulo Empresas administra el perfil y su validación. |
| RF02 | Permitir a la empresa validada crear, editar y cerrar ofertas propias con carrera, ciclo mínimo, modalidad, vacantes y fecha límite. El coordinador aprueba o rechaza cada oferta por separado. Solo las aprobadas, vigentes y no cerradas son visibles. Editar requisitos de una oferta publicada la devuelve a revisión; las postulaciones previas conservan la versión de requisitos con la que fueron aceptadas. |
| RF03 | Mostrar al estudiante ofertas publicadas y vigentes compatibles con su carrera y ciclo, con filtro por modalidad y paginación de 20 resultados. El filtrado se realiza en el backend; la elegibilidad completa se verifica al postular. |
| RF04 | Validar automáticamente carrera, ciclo y créditos requeridos antes de aceptar una postulación, usando antecedentes académicos verificados. En la versión base el coordinador registra y verifica esos antecedentes con fuente, fecha y periodo académico vigente en PostgreSQL. Si existe acceso autorizado, un adaptador puede consultar SIGA. Si faltan datos verificados del periodo vigente o falla la consulta necesaria, no aceptar la postulación e informar el motivo. No declarar implementada una integración inexistente. |
| RF05 | Mantener como máximo una postulación por estudiante y oferta, incluso ante solicitudes simultáneas. PostgreSQL debe imponer una restricción única y el backend traducir el conflicto a una respuesta controlada. |
| RF06 | Permitir al estudiante consultar sus postulaciones; a la empresa evaluar, seleccionar o rechazar candidatos de sus ofertas; y al coordinador supervisar convenios y prácticas de su ámbito. Separar los estados de Postulación, Convenio y Práctica conforme al diseño interno. Seleccionar no equivale a activar un convenio ni a iniciar una práctica. |
| RF07 | Generar notificaciones internas para nuevas ofertas compatibles, cambios de estado y revisiones pendientes. Persistirlas en PostgreSQL, relacionarlas con su destinatario y permitir marcarlas como leídas. El correo y SMS quedan fuera de la versión base. |
| RF08 | Autenticar usuarios y autorizar en el backend por rol, propiedad y ámbito: estudiante, empresa, coordinador, administrador y permisos de lectura/exportación de la Oficina de Prácticas. Obtener la identidad de las credenciales verificadas, nunca de un rol enviado por el cliente. |
| RF09 | Auditar aprobaciones, rechazos, selección de postulantes, cambios institucionales de estado y modificaciones de roles. Registrar actor, acción, recurso, fecha, resultado y motivo cuando corresponda. No almacenar contraseñas ni tokens en auditoría. |
| RF10 | Proporcionar dashboard y reportes exportables en Excel y PDF sobre ofertas, postulaciones, convenios y prácticas por periodo y carrera, respetando permisos y filtros. La generación se ejecuta en el mismo backend. |

## Trazabilidad

| Historia | Requisitos |
|---|---|
| HU-01 | RF01, RF08 |
| HU-02 | RF01, RF02, RF09 |
| HU-03 | RF02, RF08 |
| HU-04 | RF03 |
| HU-05 | RF04, RF05, RF08 |
| HU-06 | RF06, RF09 |
| HU-07 | RF07, RF08 |
| HU-08 | RF06, RF08, RF09 |
| HU-09 | RF08, RF10 |
| HU-10 | RF08, RF09 |

Estos requisitos describen la propuesta; su cumplimiento requiere implementación y pruebas.
