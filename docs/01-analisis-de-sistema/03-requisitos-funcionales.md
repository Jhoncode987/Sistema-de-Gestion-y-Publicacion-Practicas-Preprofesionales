# Requisitos Funcionales

## Lista de Requisitos Funcionales

| ID | Requisito Funcional |
|---|---|
| **RF01** | El sistema debe permitir el registro de empresas y requerir la validación del coordinador antes de habilitar la publicación de ofertas. |
| **RF02** | El sistema debe permitir publicar, editar o cerrar ofertas antes de su fecha límite, especificando carrera, ciclo, créditos requeridos cuando correspondan, modalidad, vacantes y fecha límite. Cada oferta requiere aprobación separada del coordinador antes de ser visible; editar requisitos publicados devuelve la oferta a revisión. |
| **RF03** | El sistema debe mostrar al estudiante solo las ofertas correspondientes a su carrera y ciclo. |
| **RF04** | El sistema debe validar automáticamente (mediante integración con el core académico) que el estudiante cumpla los requisitos mínimos antes de aceptar su postulación. |
| **RF05** | El sistema debe impedir que un estudiante postule más de una vez a la misma oferta. |
| **RF06** | El sistema debe permitir al estudiante consultar el estado de sus postulaciones a la empresa propietaria evaluar, seleccionar o rechazar candidatos de sus ofertas, y al coordinador dar seguimiento al convenio y práctica de su ámbito. Postulación, convenio y práctica tienen entidades y estados separados. |
| **RF07** | El sistema debe generar alertas automatizadas (nuevas ofertas para estudiantes, cambios de estado de postulación, y avisos de validación pendiente para el coordinador). Los avisos son internos, por destinatario, con fecha y estado de lectura en PostgreSQL. |
| **RF08** | El sistema debe implementar autenticación estricta con roles diferenciados (Estudiante, Empresa, Coordinador, Administrador), restringiendo el acceso a los datos según la propiedad. |
| **RF09** | El sistema debe mantener un registro de auditoría de las acciones administrativas (aprobaciones, rechazos, etc.). |
| **RF10** | El sistema debe generar reportes exportables en Excel y PDF sobre ofertas y postulaciones por periodo/carrera, e incluir un dashboard centralizado. |

## Relación entre Historias de Usuario y Requisitos Funcionales

| Historia de Usuario | Requisitos Funcionales Relacionados |
|---|---|
| **HU01** Registro de Empresa | RF01, RF08 |
| **HU02** Validación de Entidades | RF01, RF09 |
| **HU03** Publicación de Oferta | RF02 |
| **HU04** Búsqueda y Filtrado | RF03 |
| **HU05** Postulación Automática | RF04, RF05 |
| **HU06** Seguimiento de Convenio | RF06, RF10 |
| **HU07** Notificaciones | RF07 |
## Precisiones de responsabilidad y validación

- Usuarios y Autenticación posee cuentas, credenciales y roles; Ofertas posee perfil empresarial y aprobación, además de las ofertas. No se crea un módulo Empresas independiente.
- RF04 mantiene la integración académica prevista, sujeta a acceso autorizado. Si no se puede verificar, no se acepta la candidatura como elegible. Los dobles de prueba no acreditan integración real.
- RF05 requiere restricción única estudiante–oferta en PostgreSQL; una consulta previa no protege de duplicados concurrentes.
- Seleccionar no activa un convenio ni inicia una práctica. Las vacantes limitan selecciones, no el número de candidaturas.
- RF08 incluye rol, propiedad y ámbito. El personal de Oficina utiliza cuenta individual con permiso de dashboard/exportación.
- RF09 incluye evaluación/selección, cambios institucionales de estado y modificaciones de permisos.

## Historias complementarias

| Historia | Requisitos |
|---|---|
| HU-08 Evaluación de postulantes | RF06, RF08, RF09 |
| HU-09 Reportes de Oficina | RF08, RF10 |
