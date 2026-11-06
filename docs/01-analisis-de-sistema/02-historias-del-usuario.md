# Historias de usuario

Los estados y permisos son propuestas de negocio que deberán validar los responsables institucionales antes de implementar.

| Historia | Descripción | Criterio de aceptación principal | Requisitos |
|---|---|---|---|
| HU-01 Registro de empresa | Como empresa, quiero registrar mi perfil para solicitar autorización para publicar prácticas. | El perfil queda pendiente y no habilita ofertas hasta su aprobación por un coordinador. | RF01, RF08 |
| HU-02 Validación de empresas y ofertas | Como coordinador, quiero aprobar o rechazar empresas y ofertas para controlar su publicación institucional. | Empresa y oferta se revisan por separado; se registra actor, fecha y motivo. Solo una oferta aprobada y vigente es visible. | RF01, RF02, RF09 |
| HU-03 Gestión de ofertas | Como empresa validada, quiero crear, editar y cerrar mis ofertas. | Se exige carrera, ciclo mínimo, modalidad, vacantes y fecha límite. Una edición de requisitos de una oferta publicada vuelve a revisión y se conservan las postulaciones existentes. | RF02, RF08 |
| HU-04 Búsqueda y filtrado | Como estudiante, quiero consultar ofertas compatibles con mi carrera y ciclo. | El backend filtra ofertas publicadas y vigentes; permite filtrar modalidad y pagina resultados. Ver una oferta no garantiza la elegibilidad completa. | RF03 |
| HU-05 Registro de postulación | Como estudiante, quiero postular para que se verifiquen mis requisitos académicos. | Solo se acepta una solicitud si la oferta está vigente y la verificación académica es válida; solicitudes concurrentes no generan duplicados. Sin verificación disponible se informa el pendiente y no se acepta la postulación. | RF04, RF05, RF08 |
| HU-06 Seguimiento institucional | Como coordinador, quiero seguir los convenios y las prácticas de estudiantes seleccionados. | La postulación, el convenio y la práctica tienen estados separados y todo cambio institucional relevante queda auditado. | RF06, RF09 |
| HU-07 Notificaciones | Como usuario, quiero consultar avisos sobre ofertas y cambios de estado. | El backend registra notificaciones internas en PostgreSQL y cada destinatario solo consulta las propias. Incluye revisiones pendientes para el coordinador. | RF07, RF08 |
| HU-08 Evaluación de postulantes | Como empresa, quiero revisar y decidir sobre candidatos de mis ofertas. | Solo accedo a candidatos de ofertas propias; puedo pasar a revisión, seleccionar o rechazar según las transiciones definidas. La selección no activa automáticamente un convenio o una práctica. | RF06, RF08, RF09 |
| HU-09 Reportes institucionales | Como personal autorizado de la Oficina de Prácticas, quiero consultar indicadores y exportar reportes. | Se filtra por periodo y carrera; PDF y Excel respetan los mismos filtros y permisos que el dashboard. | RF08, RF10 |
| HU-10 Administración de acceso | Como administrador, quiero asignar roles y ámbitos institucionales. | Se rechazan cambios sin autorización y se registra la modificación de permisos en auditoría. | RF08, RF09 |

Los modelos de estado y reglas de concurrencia se detallan en [Diseño interno](../03-diseno-de-software/diseno-interno/01-diseno-interno.md).
