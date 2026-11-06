# API REST propia con referencia funcional Bumeran

## Alcance y evidencia

Bumeran sirve de referencia funcional para cuentas de empresas y candidatos, publicación de avisos, administración de postulantes y seguimiento. Ver [publicación y candidatos](https://www.bumeran.com.pe/productos/talento/) y [Mis postulaciones](https://www.bumeran.com.pe/blog/buscar-trabajo/que-hacer-despues-de-postular-a-un-empleo-en-bumeran/) (consulta: 6 de noviembre de 2026).

**Las rutas siguientes son diseño del sistema UNSCH. No son endpoints oficiales de Bumeran ni documentan su arquitectura interna.** No se requiere conexión a Bumeran.

Una sola aplicación backend atiende /api/v1, valida permisos, ejecuta casos de uso y persiste en PostgreSQL. No existe una API separada por módulo.

## Correspondencia funcional y operaciones

| Flujo de referencia o extensión | Operación propia | Permiso y resultado |
|---|---|---|
| Cuenta de candidato/empresa | POST /api/v1/usuarios | Registro controlado de estudiante o empresa; nunca permite autoasignar roles institucionales. 201. |
| Inicio de sesión | POST /api/v1/sesiones | Credenciales válidas: 200; inválidas: 401. |
| Perfil de empresa | POST /api/v1/empresas | Empresa autenticada; crea perfil pendiente vinculado a su cuenta. 201. |
| Revisión institucional propia | PATCH /api/v1/empresas/{id}/validacion | Coordinador de ámbito autorizado; aprobar/rechazar con motivo. 200. |
| Publicación de aviso | POST /api/v1/ofertas | Empresa aprobada; crea oferta pendiente de revisión. 201. |
| Edición de aviso | PATCH /api/v1/ofertas/{id} | Empresa propietaria; una edición de requisitos devuelve la oferta a revisión y crea versión. 200. |
| Revisión institucional propia | PATCH /api/v1/ofertas/{id}/validacion | Coordinador de ámbito autorizado; publicar o rechazar. 200. |
| Cierre de aviso | PATCH /api/v1/ofertas/{id}/cierre | Empresa propietaria; cierra recepción de candidaturas. 200. |
| Búsqueda de avisos | GET /api/v1/ofertas?modalidad=remota&page=1&pageSize=20 | Estudiante: carrera/ciclo derivados de sus datos, no modificables para evadir filtros. 200. |
| Consulta de aviso | GET /api/v1/ofertas/{id} | Estudiante compatible ve una oferta publicada; propietario y coordinador autorizado pueden consultar pendientes. 200. |
| Postulación a aviso | POST /api/v1/postulaciones | Estudiante autenticado; cuerpo con ofertaId. Identidad tomada de credenciales. 201. |
| Mis postulaciones | GET /api/v1/me/postulaciones | Solo postulaciones del estudiante autenticado, paginadas. 200. |
| Administración de candidatos | GET /api/v1/ofertas/{id}/postulaciones | Solo empresa propietaria o coordinador autorizado; limitar datos a la finalidad de selección. 200. |
| Evaluación de candidato | PATCH /api/v1/postulaciones/{id}/estado | Empresa propietaria: revisión, selección o rechazo; estudiante: retiro propio según estado. 200. |
| Convenio institucional propio | POST /api/v1/convenios | Coordinador autorizado; requiere postulación seleccionada e identifica estudiante y empresa desde ella. 201. |
| Seguimiento institucional propio | PATCH /api/v1/convenios/{id}/estado | Coordinador autorizado; transiciones del modelo de convenio. 200. |
| Seguimiento de práctica propio | POST /api/v1/practicas | Coordinador autorizado; requiere convenio activo. 201. |
| Seguimiento de práctica propio | PATCH /api/v1/practicas/{id}/estado | Coordinador autorizado; transiciones del modelo de práctica. 200. |
| Antecedentes académicos propios | PUT /api/v1/estudiantes/{id}/antecedentes | Coordinador autorizado; fuente, fecha de verificación, periodo, carrera, ciclo y créditos. 200. |
| Avisos internos propios | GET /api/v1/me/notificaciones | Solo destinatario; resultados paginados. 200. |
| Lectura de aviso propio | PATCH /api/v1/me/notificaciones/{id} | Solo destinatario; marcar como leído. 200. |
| Reportes institucionales propios | GET /api/v1/reportes?periodo=2026-II&carrera=sistemas&formato=pdf | Permiso de reportes y ámbito autorizado; admite json para dashboard, pdf o xlsx. 200. |
| Administración propia | PATCH /api/v1/usuarios/{id}/roles | Administrador autorizado; modificación auditada. 200. |

La similitud funcional se aplica a empresas, ofertas y postulaciones. Validación académica, convenios, prácticas, reportes y avisos internos son decisiones del proyecto UNSCH.

## Contratos y errores comunes

- HTTPS; JSON en solicitudes y respuestas de negocio. Reportes usan el tipo de contenido del archivo. Identificadores opacos y fechas ISO 8601.
- Listados: page ≥ 1, pageSize entre 1 y 20; respuesta con items, page, pageSize y total.
- 400: formato inválido. 401: credenciales ausentes/inválidas. 403: identidad sin permiso o sin propiedad/ámbito. 404: recurso inexistente.
- 409: postulación duplicada, transición incompatible, oferta cerrada o cambio concurrente que invalida la operación.
- 422: criterios académicos no cumplidos o sin antecedentes verificados del periodo vigente. Distinguir ambos con códigos de error.
- 503: falla técnica temporal de la verificación necesaria, incluida SIGA solo si se habilita. No transformar una falla técnica en elegibilidad.
- Error JSON con codigo, mensaje y correlationId. Sin SQL, secretos ni datos personales innecesarios.
- Los 5xx inesperados se registran en servidor y cuentan como fallos en la prueba de carga.

## Ejemplo de postulación

Solicitud autenticada:

~~~json
{"ofertaId":"oferta-123"}
~~~

Respuesta 201:

~~~json
{"id":"postulacion-456","ofertaId":"oferta-123","estado":"registrada"}
~~~

Repetición de la misma pareja: 409 con codigo POSTULACION_DUPLICADA. Antecedentes pendientes: 422 con codigo VERIFICACION_PENDIENTE; no se crea postulación aceptada. El ejemplo ilustra el contrato, no una llamada ejecutada.

## Seguridad y consistencia en backend

Antes de escribir, verificar identidad, rol, propiedad, ámbito y estado permitido. Revalidar vigencia y versión de la oferta dentro de la transacción a través de Ofertas. PostgreSQL impone unicidad estudiante–oferta; cualquier conflicto se traduce a 409. Selección y número de vacantes se coordinan transaccionalmente; las candidaturas no consumen vacantes.

El contrato HTTP permanece estable cuando cambia un adaptador de infraestructura. Ver AC03/EQ-04 y [Diseño interno](../03-diseno-de-software/diseno-interno/01-diseno-interno.md).

## Estado

Contratos propuestos; aún falta elegir framework, implementar, producir la especificación OpenAPI y ejecutar las pruebas. No se afirma que estos endpoints estén disponibles.
