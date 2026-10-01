# Requisitos Funcionales

## Lista de Requisitos Funcionales

| ID | Requisito Funcional |
|---|---|
| **RF01** | El sistema debe permitir el registro de empresas y requerir la validación del coordinador antes de habilitar la publicación de ofertas. |
| **RF02** | El sistema debe permitir publicar, editar o cerrar ofertas antes de su fecha límite, especificando carrera, ciclo, modalidad y vacantes. |
| **RF03** | El sistema debe mostrar al estudiante solo las ofertas correspondientes a su carrera y ciclo. |
| **RF04** | El sistema debe validar automáticamente (mediante integración con el core académico) que el estudiante cumpla los requisitos mínimos antes de aceptar su postulación. |
| **RF05** | El sistema debe impedir que un estudiante postule más de una vez a la misma oferta. |
| **RF06** | El sistema debe permitir al estudiante consultar el estado de sus postulaciones y al coordinador dar seguimiento al ciclo de vida del convenio. |
| **RF07** | El sistema debe generar alertas automatizadas (nuevas ofertas para estudiantes, cambios de estado de postulación, y avisos de validación pendiente para el coordinador). |
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