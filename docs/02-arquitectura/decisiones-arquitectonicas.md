# Registro de decisiones arquitectónicas

Estado general: decisiones de diseño para la entrega académica, pendientes de implementación y validación. Esta revisión reemplaza las propuestas anteriores de infraestructura adicional y alinea la documentación con tres atributos y una carga de 20 a 25 usuarios simultáneos.

## ADR-001 — Backend monolítico con PostgreSQL

- Estado: seleccionado.
- Contexto: presupuesto académico, carga objetivo de 20 a 25 usuarios y funcionalidades estrechamente relacionadas.
- Drivers: DA01, DA02, DA04; RC04, RC05.
- Decisión: una aplicación backend desplegable con módulos internos y PostgreSQL como única base. Servir los archivos compilados del portal desde ese despliegue.
- Alternativas: monolito sin límites internos, monolito modular, microservicios.
- Justificación: mantener desarrollo, transacciones y operación manejables.
- Consecuencias: todos los módulos se actualizan juntos; una falla puede afectar al conjunto; los límites deben revisarse. La capacidad se demuestra con mediciones.

## ADR-002 — Clean Architecture y contratos públicos

- Estado: seleccionado.
- Drivers: DA04, DA06; AC03.
- Decisión: dominio y aplicación definen reglas y puertos; presentación e infraestructura dependen del núcleo. Los módulos se comunican en memoria mediante contratos públicos.
- Alternativas: lógica en controladores, capas sin control de dependencias.
- Consecuencias: permite pruebas aisladas; requiere mantener interfaces y evitar abstracciones innecesarias.
- Verificación: dominio sin importaciones del framework/ORM; EQ-04 sin cambios fuera del adaptador afectado.

## ADR-003 — Simplificar tareas del backend

- Estado: seleccionado; sustituye la evaluación previa de caché y mensajería para esta entrega.
- Drivers: DA02; RC05.
- Decisión: no incorporar Redis, RabbitMQ, microservicios ni bases adicionales. Resolver búsqueda, notificaciones internas, auditoría y reportes en el backend con PostgreSQL.
- Alternativas: caché externa, broker, proveedor de correo y worker independiente.
- Consecuencias: menos componentes operativos; se deben controlar consultas y duración de transacciones. No se promete entrega de correo/SMS.
- Verificación: EQ-01/EQ-02; no confundir una optimización futura hipotética con el diseño base.

## ADR-004 — Verificación académica operable sin integración confirmada

- Estado: seleccionado para la base; SIGA condicionado a autorización.
- Drivers: DA03; RF04, RC02.
- Decisión: definir VerificadorAcademico. La base consulta antecedentes del periodo vigente verificados por el coordinador y registrados con evidencia de fuente y fecha en PostgreSQL. Un futuro adaptador SIGA conserva el contrato.
- Alternativas: exigir una API externa no disponible; aceptar datos declarados por el estudiante.
- Consecuencias: requiere revisión institucional y actualización de antecedentes; no se acepta postulación con verificación ausente o caducada.
- Verificación: elegible, no elegible, falta de antecedentes, datos fuera de periodo y fallas técnicas. Las pruebas simuladas no acreditan integración real.

## ADR-005 — Propiedad modular y transacciones

- Estado: seleccionado.
- Drivers: DA04, DA07; RF05, RF09; AC02, AC03.
- Decisión: Empresas posee perfil y aprobación; Usuarios posee credenciales. Postulaciones consulta un contrato público de Ofertas y otro de Verificación Académica. Cada módulo escribe sus propias tablas.
- Decisión transaccional: en un mismo proceso y PostgreSQL, una unidad de trabajo compartida permite que contratos de escritura autorizados participen de la misma transacción sin exponer tablas. Fallar una escritura obligatoria revierte la operación.
- Consecuencias: restricción única estudiante–oferta; cambios de estado, auditoría y notificaciones obligatorias se confirman juntos. Ofertas conserva versiones de requisitos y participa en el bloqueo/revalidación antes de aceptar una candidatura.
- Verificación: duplicados concurrentes, cierre de oferta durante postulación y rollback de fallos parciales.

## ADR-006 — Bumeran como referencia funcional de contenedores y REST

- Estado: seleccionado.
- Drivers: DA05; RC06.
- Decisión: relacionar las responsabilidades conceptuales de interfaz, procesamiento y persistencia con los flujos de empresa, aviso y candidato. Diseñar nuestra API con recursos propios de empresas, ofertas y postulaciones.
- Alternativas: imitar tecnología interna no documentada; depender de endpoints privados.
- Consecuencias: el C2 describe nuestro monolito; las rutas REST son propuestas UNSCH. Las extensiones académicas tienen contratos propios.
- Evidencia: fuentes funcionales enlazadas en arquitectura-inicial.md y api-rest.md.

## Trazabilidad

| Decisión | Referencias | Evidencia esperada |
|---|---|---|
| ADR-001 | DA01, DA02, DA04; RC05 | Una aplicación y PostgreSQL; pruebas de carga. |
| ADR-002 | DA06; AC03 | Pruebas aisladas y EQ-04. |
| ADR-003 | DA02; AC01 | EQ-01/EQ-02 con 20 y 25 usuarios. |
| ADR-004 | DA03; RF04 | Verificación académica trazable y fallos explícitos. |
| ADR-005 | DA04, DA07; RF05, RF09 | Pruebas de integridad, límites y autorización. |
| ADR-006 | DA05; RC06 | Correspondencia funcional y contratos REST propios. |
