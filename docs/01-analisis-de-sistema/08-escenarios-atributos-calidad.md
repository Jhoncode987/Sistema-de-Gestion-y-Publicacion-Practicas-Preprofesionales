# Escenarios de atributos de calidad

Se priorizan AC01 Rendimiento, AC02 Seguridad y AC03 Mantenibilidad. La indicación **20 a 25 se interpreta como usuarios simultáneos**, no como número de escenarios. Todos los valores son objetivos propuestos, no resultados.

## Protocolo reproducible de carga

- Backend monolítico y PostgreSQL; registrar commit, CPU, RAM, versiones y configuración.
- Semilla ficticia propuesta: 1 000 ofertas, 100 empresas, 5 000 postulaciones y 25 cuentas de estudiante.
- Ejecutar por separado con **20 y 25 usuarios simultáneos**. Cada usuario mantiene una sesión, una solicitud en curso y 2 segundos de espera entre operaciones.
- Por ejecución: 1 minuto de subida, 2 minutos de calentamiento y 10 minutos de medición estable. Reiniciar datos entre ejecuciones.
- Medir latencia HTTP p50/p95, máximo, solicitudes por segundo y errores, solo en la fase estable. Contar timeouts, 5xx y respuestas inesperadas como fallos; separar 4xx esperados.
- Para medir el backend sin una integración no autorizada, usar un doble reproducible de Integración Académica con respuestas elegibles ficticias. Esta prueba no mide la latencia de SIGA ni acredita integración real. Cuando se autorice, ejecutar y registrar además una prueba con la dependencia real.

## EQ-01 — AC01 Rendimiento: búsqueda

| Elemento | Definición |
|---|---|
| Fuente | 20 estudiantes autenticados y, en otra ejecución, 25 estudiantes. |
| Estímulo | Consultan ofertas alternando modalidad y páginas de 20 resultados. |
| Artefacto | GET /api/v1/ofertas, módulo Ofertas y PostgreSQL. |
| Entorno | Protocolo común; varias carreras/ciclos y estados de publicación. |
| Respuesta | Resultados vigentes, publicados y compatibles con carrera/ciclo del estudiante. |
| Medida | En cada ejecución: p95 ≤ 2 segundos, fallos < 1 % y cero ofertas incompatibles/no publicadas en las respuestas comprobadas. |
| Verificación | Guardar script, semilla y métricas; contrastar filtros y paginación. |
| Estado | Pendiente de implementación y ejecución. |

## EQ-02 — AC01 Rendimiento: postulación

| Elemento | Definición |
|---|---|
| Fuente | 20 estudiantes y, por separado, 25 estudiantes con respuestas académicas ficticias elegibles. |
| Estímulo | Envían postulaciones a combinaciones estudiante–oferta distintas y válidas. |
| Artefacto | POST /api/v1/postulaciones, contratos de Ofertas/Integración Académica y PostgreSQL. |
| Entorno | Protocolo común; ofertas vigentes; semilla restaurada entre ejecuciones. |
| Respuesta | Registra candidatura y aviso interno; devuelve 201. |
| Medida | En cada ejecución: p95 ≤ 3 segundos y fallos < 1 % para solicitudes válidas. |
| Verificación | Contrastar respuestas y filas. Ejecutar aparte una ráfaga de 25 solicitudes simultáneas de una misma cuenta a la misma oferta: exactamente 1 fila, 1 respuesta 201 y 24 respuestas 409, sin 5xx. |
| Estado | Pendiente de implementación y ejecución. |

Los 409 de duplicidad esperados se registran aparte y no se mezclan con la medición de solicitudes válidas. La restricción única estudiante–oferta es obligatoria para RF05.

## EQ-03 — AC02 Seguridad: rol, propiedad y ámbito

| Elemento | Definición |
|---|---|
| Fuente | 25 cuentas: 15 estudiantes, 5 empresas, 3 coordinadores, 1 administrador y 1 cuenta de Oficina con permiso de reportes; añadir solicitudes sin credenciales. |
| Estímulo | Matriz fija de 50 accesos no autorizados y 25 controles autorizados a recursos propios, ajenos y de otra escuela. |
| Artefacto | API REST, permisos y operaciones del backend. |
| Entorno | Recursos ficticios de al menos dos escuelas, con propietarios y estados conocidos. |
| Respuesta | 401 sin credenciales válidas; 403 con identidad sin permiso; respuesta 2xx prevista para los controles válidos. No filtrar datos ni cambiar recursos en accesos denegados. |
| Medida | 50/50 accesos inválidos rechazados, cero datos protegidos expuestos y cero escrituras indebidas; 25/25 controles válidos exitosos. |
| Verificación | Versionar matriz con ID de caso, cuenta, rol, recurso, ámbito, estado previo y resultado esperado/obtenido. Comparar datos antes/después. |
| Estado | Pendiente de definir cada caso y ejecutar. |

La matriz debe cubrir consulta de postulaciones ajenas, edición de ofertas de otra empresa, autoaprobación de empresa/oferta, acceso a otra escuela, exportación sin permiso y modificación de roles sin autorización.

## EQ-04 — AC03 Mantenibilidad: cambio localizado

| Elemento | Definición |
|---|---|
| Fuente | Desarrollador que modifica el adaptador PostgreSQL de Postulaciones. |
| Estímulo | Cambia una consulta SQL y su mapeo conservando PostulacionRepository y el contrato REST. |
| Artefacto | Infraestructura del módulo Postulaciones. |
| Entorno | Código y pruebas existentes, mismo contrato antes/después. |
| Respuesta | El cambio queda en el adaptador y sus pruebas; no altera dominio, casos de uso, controladores ni otros módulos. |
| Medida | Cero archivos de producción modificados fuera de infraestructura de Postulaciones; 100 % de las pruebas previamente aprobadas de contratos y regresión siguen pasando. |
| Verificación | Revisar diff y resultados antes/después: consulta, guardado, conflicto de unicidad y error de persistencia. |
| Estado | Pendiente de implementación y pruebas. |

La mantenibilidad se mide por alcance del cambio y regresión; no requiere inventar usuarios concurrentes.

## Registro de evidencia

Guardar fecha, commit, entorno, semilla, usuarios, duración, cantidad de solicitudes, latencias, errores y resultados de integridad/seguridad. No declarar cumplido un objetivo sin evidencia. La disponibilidad no se añade como cuarto atributo de esta entrega.
