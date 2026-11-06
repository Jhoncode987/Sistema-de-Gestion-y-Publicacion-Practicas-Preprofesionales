# Escenarios medibles de atributos de calidad

Se evalúan los tres atributos AC01 Rendimiento, AC02 Seguridad y AC03 Mantenibilidad. **20 y 25 se interpretan como usuarios simultáneos, no como cantidad de escenarios.** Se usa 25 como carga máxima objetivo de esta entrega.

Todas las medidas son criterios de aceptación propuestos. No se han ejecutado pruebas ni obtenido resultados.

## Protocolo común de carga

- Preparar un entorno de prueba con un backend monolítico y PostgreSQL. Registrar CPU, RAM, sistema operativo, versiones, configuración, latencia de red y commit probado.
- Semilla propuesta: 1 000 ofertas, 100 empresas, 5 000 postulaciones y 25 cuentas de estudiante con antecedentes académicos verificados del periodo vigente. Usar datos ficticios reproducibles, nunca datos personales reales.
- Un usuario virtual mantiene una sesión autenticada, realiza una operación y espera 2 segundos antes de la siguiente; cada usuario tiene como máximo una solicitud en curso.
- Ejecutar por separado con **20 y 25 usuarios simultáneos**: 1 minuto de subida, 2 minutos de calentamiento y 10 minutos de medición estable. Calcular las métricas únicamente sobre la fase estable y registrar el número de solicitudes de cada operación.
- Medir latencia HTTP de extremo a extremo, p50, p95, máximo, solicitudes por segundo y porcentaje de fallos. Un timeout o 5xx es fallo técnico; un 4xx esperado se registra por separado. Una operación que debía ser válida y devuelve un error también incumple el escenario.
- Repetir el mismo conjunto de datos desde una copia inicial para cada nivel de carga. Adjuntar script, semilla, parámetros y resultados.

## EQ-01 — AC01 Rendimiento: búsqueda de ofertas

| Elemento | Definición |
|---|---|
| Fuente | 20 estudiantes y, en una ejecución separada, 25 estudiantes autenticados. |
| Estímulo | Cada usuario consulta ofertas compatibles alternando filtros de modalidad y páginas de 20 resultados. |
| Artefacto | GET /api/v1/ofertas, módulo Ofertas y PostgreSQL. |
| Entorno | Protocolo común, con ofertas publicadas y vigentes de varias carreras y ciclos. |
| Respuesta | Devuelve únicamente resultados autorizados y compatibles, con paginación estable. |
| Medida | En cada ejecución, p95 ≤ 2 segundos y fallos < 1 %; cero ofertas no publicadas o incompatibles en las respuestas verificadas. |
| Verificación | Guardar latencias y errores; contrastar filtros, visibilidad y paginación con la semilla. |
| Estado | Pendiente de implementación y ejecución. |

## EQ-02 — AC01 Rendimiento: postulación y concurrencia

| Elemento | Definición |
|---|---|
| Fuente | 20 estudiantes y, en otra ejecución, 25 estudiantes con antecedentes verificados. |
| Estímulo | Cada usuario envía postulaciones a combinaciones estudiante–oferta distintas y válidas; se reinicia la semilla entre ejecuciones. |
| Artefacto | POST /api/v1/postulaciones, verificación académica local, transacción y PostgreSQL. |
| Entorno | Protocolo común; ofertas vigentes sin cierre o edición concurrente durante la fase de latencia. |
| Respuesta | Registra la postulación y su notificación interna; devuelve 201 sin exceder una postulación por pareja. |
| Medida | En cada nivel, p95 ≤ 3 segundos y fallos < 1 % para solicitudes válidas. |
| Verificación | Contrastar respuestas con filas persistidas. Ejecutar además una ráfaga separada de 25 solicitudes simultáneas de la misma cuenta a la misma oferta: exactamente una fila, una respuesta 201 y 24 respuestas 409; cero 5xx. |
| Estado | Pendiente de implementación y ejecución. |

La ráfaga de duplicados mide RF05 y se registra aparte; sus respuestas 409 esperadas no se mezclan con las métricas de postulaciones válidas. Las vacantes limitan selecciones, no el número de candidaturas.

## EQ-03 — AC02 Seguridad: rol, propiedad y ámbito

| Elemento | Definición |
|---|---|
| Fuente | 25 cuentas: 15 estudiantes, 5 empresas, 3 coordinadores, 1 administrador y 1 cuenta con permiso de reportes de la Oficina. También se prueban solicitudes sin credenciales. |
| Estímulo | Ejecutar una matriz fija de 50 solicitudes no autorizadas y 25 solicitudes autorizadas sobre recursos propios, ajenos y de otra escuela. |
| Artefacto | Autenticación y autorización del backend; endpoints de empresas, ofertas, postulaciones, convenios, prácticas, reportes y roles. |
| Entorno | Semilla con recursos de al menos dos escuelas y propietarios diferentes; operaciones válidas y estados conocidos. |
| Respuesta | Sin credenciales válidas: 401. Con identidad válida pero sin permiso: 403. Con permiso y solicitud válida: respuesta 2xx prevista. No exponer datos ni alterar recursos en operaciones denegadas. |
| Medida | 50/50 intentos no autorizados rechazados, cero datos protegidos expuestos y cero escrituras indebidas; 25/25 controles autorizados exitosos. |
| Verificación | Versionar matriz con identidad, rol, recurso, ámbito, estado previo, respuesta esperada y obtenida. Comparar registros de negocio antes y después; los registros de seguridad se revisan aparte. |
| Estado | Pendiente de construir la matriz y ejecutar pruebas. |

Los 50 casos incluyen lectura de postulaciones ajenas, edición de ofertas de otra empresa, autoaprobación de empresa/oferta, acceso de coordinador a otra escuela, exportación sin permiso y cambio de roles no autorizado. La matriz debe asignar un identificador y resultado esperado a cada caso antes de ejecutar.

## EQ-04 — AC03 Mantenibilidad: cambio localizado en el backend

| Elemento | Definición |
|---|---|
| Fuente | Desarrollador que modifica la persistencia de consulta académica. |
| Estímulo | Cambiar la consulta SQL y el mapeo del adaptador de antecedentes académicos, conservando el contrato VerificadorAcademico. |
| Artefacto | Adaptador PostgreSQL del módulo Verificación Académica. |
| Entorno | Backend implementado con módulos y pruebas; mismo conjunto de contratos antes y después del cambio. |
| Respuesta | El cambio queda en infraestructura del módulo y sus pruebas; no altera dominio, casos de uso, controladores, API pública ni otros módulos. |
| Medida | Cero archivos de producción modificados fuera de infraestructura de Verificación Académica; 100 % de las pruebas previamente aprobadas del caso de uso y sus contratos siguen pasando. |
| Verificación | Revisar diff y reportes de pruebas antes/después; incluir elegible, no elegible, antecedentes ausentes y error de persistencia. |
| Estado | Pendiente de implementación y pruebas. |

Este escenario no requiere usuarios simultáneos porque mide un cambio de código. No se inventa una carga de usuarios para un atributo que no se mide con concurrencia.

## Registro de resultados

Para cada ejecución guardar fecha, commit, entorno, semilla, usuarios, duración, número de solicitudes, p95, errores y evidencia de integridad o autorización. Solo se declara cumplido un escenario cuando exista esa evidencia. No se establece un objetivo adicional de disponibilidad en esta entrega.
