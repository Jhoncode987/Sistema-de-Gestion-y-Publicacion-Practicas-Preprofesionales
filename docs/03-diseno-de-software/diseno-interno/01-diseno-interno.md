# Diseño interno del backend de prácticas UNSCH

Estado: propuesta conceptual. No se afirma que las clases, endpoints, integraciones o pruebas estén implementados.

## 1. Organización

Un backend monolítico, con API REST y PostgreSQL como única base. React corre en el navegador y obtiene sus archivos del mismo despliegue. Todos los módulos del backend se actualizan juntos.

| Módulo | Datos propios y contrato |
|---|---|
| Usuarios y Autenticación | Cuentas, roles y ámbitos; servicio de identidad autenticada. |
| Empresas | Perfil y validación institucional; ConsultaEmpresaValidada. |
| Ofertas | Requisitos versionados, publicación, revisión y cierre; ConsultaOfertas y control transaccional de vigencia. |
| Postulaciones | Registro, evaluación, selección, retiro y unicidad. |
| Convenios y Prácticas | Entidades separadas con seguimiento institucional; no se confunden sus estados. |
| Verificación Académica | Antecedentes verificados del periodo vigente; VerificadorAcademico. |
| Notificaciones | Avisos internos por destinatario y lectura; RegistrarNotificacion. |
| Reportes y Auditoría | Proyecciones por contratos públicos y registro de acciones sensibles. |

Cada módulo contiene dominio, aplicación, presentación e infraestructura. Ninguno accede directamente a tablas internas de otro. Empresas posee el perfil empresarial; Usuarios solo administra identidad y acceso.

## 2. Componentes de Postulaciones

| Componente | Responsabilidad |
|---|---|
| PostulacionesController | Obtener identidad autenticada; validar formato; invocar el caso de uso; mapear respuestas HTTP. |
| RegistrarPostulacion | Coordinar permisos, consulta de oferta, verificación académica y escritura transaccional. |
| CambiarEstadoPostulacion | Autorizar actor y validar transición; coordinar selección con vacantes y auditoría. |
| ConsultarPostulaciones | Limitar resultados por estudiante, empresa propietaria o ámbito del coordinador. |
| Postulacion | Id, estudianteId, ofertaId, versionRequisitos, fecha y estado; invariantes y transiciones. |
| ConsultaOfertas | Puerto público que devuelve DTO de requisitos/vigencia/versión y permite revalidación transaccional. |
| FachadaOfertas | Implementa ese puerto en el módulo Ofertas y utiliza únicamente sus repositorios privados. |
| VerificadorAcademico | Devuelve elegible, no elegible, verificación pendiente o fallo técnico. |
| FachadaAcademica | Implementa el contrato con antecedentes verificados del periodo vigente en PostgreSQL. |
| PostulacionRepository | Puerto privado para guardar y consultar postulaciones. |
| PostulacionRepositoryPostgres | Implementa persistencia y traduce conflictos de unicidad. |
| UnidadDeTrabajo | Coordina commit/rollback de la conexión PostgreSQL usada por los contratos participantes. |

No se define un repositorio de Ofertas dentro de Postulaciones. La consulta cruza el límite modular mediante fachada, no mediante SQL a tablas ajenas.

## 3. Estados de negocio separados

Los siguientes estados y transiciones son la propuesta de esta revisión y requieren validación institucional.

| Entidad | Transiciones permitidas | Actor |
|---|---|---|
| Empresa | pendiente → aprobada o rechazada; rechazada → pendiente al corregir | Coordinador decide; empresa corrige. |
| Oferta | borrador → pendiente_revision; pendiente_revision → publicada o rechazada; rechazada → borrador; publicada → cerrada o vencida | Empresa envía/cierra; coordinador aprueba/rechaza; backend determina vencimiento por fecha. |
| Oferta editada | publicada → pendiente_revision al cambiar requisitos; crear nueva versión | Empresa propietaria. |
| Postulación | registrada → en_revision; registrada o en_revision → seleccionada o rechazada; registrada o en_revision → retirada | Empresa propietaria evalúa; estudiante retira su candidatura. |
| Convenio | borrador → pendiente_firma → activo → finalizado; borrador o pendiente_firma → cancelado; activo → cancelado con justificación | Coordinador autorizado, después de verificar evidencia de firma cuando corresponda. |
| Práctica | pendiente_inicio → en_curso → culminada; pendiente_inicio o en_curso → cancelada | Coordinador autorizado. |

Seleccionada, rechazada y retirada son finales para la postulación en esta versión. No se admite volver a postular después del retiro a la misma oferta: RF05 conserva una sola candidatura histórica.

Un convenio requiere una postulación seleccionada. Activarlo no inicia automáticamente la práctica. Una práctica requiere convenio activo y no puede empezar antes de su fecha de inicio. Finalizar un convenio exige práctica culminada o cancelada; cancelarlo cancela la práctica pendiente/en curso en la misma operación auditada.

Una oferta vencida no admite nuevas candidaturas aunque el estado almacenado aún no se haya actualizado: se comprueba la fecha en cada consulta y escritura. Cerrar o editar una oferta conserva postulaciones anteriores y su versión de requisitos.

## 4. Reglas e invariantes

1. Solo una empresa aprobada puede enviar ofertas a revisión; el coordinador aprueba la oferta por separado.
2. Solo ofertas publicadas, vigentes y compatibles se presentan al estudiante.
3. La verificación al postular comprueba carrera, ciclo y créditos; la visibilidad por filtros no basta.
4. Los antecedentes locales incluyen fuente, fecha de verificación, verificador y periodo vigente. El estudiante no puede autoaprobarlos.
5. Sin antecedentes válidos: verificación pendiente, respuesta 422 y ninguna postulación aceptada. Si falla técnicamente un verificador necesario: 503.
6. Una restricción UNIQUE(estudiante_id, oferta_id) protege RF05 incluso con solicitudes concurrentes.
7. Las vacantes limitan selecciones, no candidaturas. La selección bloquea/revalida el recurso oferta por contrato de Ofertas y comprueba las selecciones existentes en Postulaciones para evitar exceder vacantes.
8. No se reduce el número de vacantes por debajo de las selecciones ya existentes. La edición correspondiente coordina la comprobación mediante contratos públicos.
9. Cambios institucionales y de evaluación relevantes producen auditoría; notificaciones obligatorias y cambios se confirman juntos.
10. Permisos por rol, propiedad y ámbito se verifican en backend. La identidad se toma de credenciales verificadas.

## 5. Flujo: registrar postulación

~~~mermaid
sequenceDiagram
    actor E as Estudiante
    participant C as Controlador
    participant U as RegistrarPostulacion
    participant F as Fachadas públicas
    participant P as Persistencia propia
    E->>C: POST /api/v1/postulaciones
    C->>C: Autenticar y autorizar
    C->>U: ejecutar(identidad, ofertaId)
    U->>F: Consultar oferta y verificar antecedentes
    F-->>U: Requisitos, versión y resultado
    U->>P: Iniciar unidad de trabajo
    U->>F: Bloquear y revalidar oferta y versión
    F-->>U: Oferta vigente y versión consistente
    U->>P: Guardar con restricción única
    U->>F: Registrar notificación interna
    U->>P: Commit
    U-->>C: Postulación registrada
    C-->>E: 201 Created
~~~

Todas las fachadas pertenecen al mismo proceso; cada una escribe sus tablas usando la unidad de trabajo. La comprobación inicial se realiza fuera de una transacción larga; antes del INSERT, Ofertas obtiene un bloqueo compatible con el utilizado por cierre/edición y revalida estado, fecha y versión. Si la versión cambia, se revierte y devuelve 409 para que el estudiante consulte los requisitos actualizados.

Si el registro académico local cambia durante la operación, Verificación Académica debe revalidar su versión dentro de la unidad de trabajo. Si se habilita SIGA, registrar fuente y fecha de la verificación externa; no mantener bloqueos de base de datos durante la llamada de red.

No basta con consultar si existe una candidatura antes de insertar: se requiere la restricción única y tratamiento de conflicto. Si falla cualquier escritura obligatoria, hacer rollback; no devolver éxito parcial.

## 6. Flujo: aprobación y publicación

1. La empresa registra su perfil: pendiente.
2. Un coordinador con ámbito autorizado aprueba o rechaza el perfil con motivo; se audita la decisión.
3. Una empresa aprobada crea/envía una oferta: pendiente_revision.
4. El coordinador aprueba o rechaza la oferta por separado.
5. Solo al aprobar y estar vigente se vuelve visible; se generan avisos internos a estudiantes compatibles.
6. Una edición de requisitos publicada crea versión y vuelve a revisión. No se altera la historia de candidaturas existentes.

La empresa no puede aprobar su perfil ni su oferta. Auditoría, cambios y notificaciones participan de la transacción del backend. Para esta carga se propone generación interna sin broker; EQ-01/EQ-02 deben validar los tiempos.

## 7. Seguridad

| Actor | Operaciones autorizadas |
|---|---|
| Estudiante | Ofertas compatibles y publicadas; postulación/retiro propio; lectura de sus estados y avisos. |
| Empresa | Perfil y ofertas propios; candidatos de esas ofertas; evaluación dentro de transiciones válidas. |
| Coordinador | Empresas/ofertas y antecedentes de su ámbito; gestión de convenios y prácticas asignados. |
| Administrador | Roles, cuentas, ámbitos y auditoría; no hereda decisiones académicas sin asignación explícita. |
| Oficina de Prácticas | Dashboard y exportación con permisos de lectura y ámbito asignado. |

Se propone autenticación por token con validación en servidor; el mecanismo y gestión de sesión se concretarán al elegir framework. Secretos fuera del código. Contraseñas con hash adecuado, nunca texto plano. HTTPS en el despliegue. Auditoría sin contraseñas, tokens ni detalles personales innecesarios.

## 8. Patrones y cambios del backend

Repository se usa para persistencia privada del módulo; Adapter para implementaciones técnicas; DTO para contratos HTTP y entre módulos; inyección de dependencias para ensamblar. No se exige Strategy si no hay variantes reales.

El cambio evaluado en EQ-04 sustituye una consulta/mapeo de antecedentes en infraestructura conservando VerificadorAcademico. No modifica casos de uso, dominio ni endpoints. Cambiar reglas del negocio sí puede requerir cambiar y probar el dominio.

## 9. Pruebas previstas

| Prueba | Evidencia esperada |
|---|---|
| Dominio | Transiciones permitidas y rechazo de transiciones inválidas en las tres entidades. |
| Aplicación | Oferta vigente/cerrada, elegible/no elegible, datos pendientes, permisos y errores técnicos. |
| Persistencia | UNIQUE, rollback, versión de oferta, cierre/edición concurrente y selección sin exceder vacantes. |
| Límites modulares | Postulaciones no importa repositorios privados de Ofertas ni lee sus tablas. |
| Carga | EQ-01 y EQ-02, por separado con 20 y 25 usuarios. |
| Duplicados | 25 peticiones simultáneas de la misma pareja: 1 registro/201 y 24 conflictos/409. |
| Seguridad | EQ-03: 25 cuentas, 50 denegaciones y 25 controles autorizados. |
| Mantenibilidad | EQ-04: diff localizado y pruebas antes/después. |

Los datos de pruebas son ficticios. Las simulaciones no se presentan como integración real con SIGA.

## 10. Trazabilidad y pendientes

RF01/RF02: aprobación separada. RF03: filtros. RF04: verificación académica. RF05: unicidad. RF06: estados separados y selección. RF07: notificaciones internas. RF08/RF09: permisos y auditoría. RF10: dashboard y exportación en backend.

Solo se priorizan AC01 Rendimiento, AC02 Seguridad y AC03 Mantenibilidad. Framework, código, migraciones, configuración de ejecución, OpenAPI y pruebas ejecutadas siguen pendientes. La vista conceptual de despliegue está documentada, pero no acredita instalación.

## Referencias

- [Requisitos](../../01-analisis-de-sistema/03-requisitos-funcionales.md)
- [Atributos](../../01-analisis-de-sistema/04-atributos-de-calidad.md)
- [Escenarios](../../01-analisis-de-sistema/08-escenarios-atributos-calidad.md)
- [C4 y despliegue](../../02-arquitectura/diagramas-c4/diagramas-c4.md)
- [API REST propia](../../02-arquitectura/api-rest.md)
