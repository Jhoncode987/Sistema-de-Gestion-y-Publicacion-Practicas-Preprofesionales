# Registro de Decisiones Arquitectónicas (ADR)

Este documento registra las decisiones principales para el Sistema Web para la Gestión y Publicación de Prácticas Preprofesionales de la UNSCH. Las decisiones se derivan de los drivers y atributos documentados en `analisis-de-sistema/`.

> **Estado:** propuestas para la arquitectura del proyecto. Deben validarse con el equipo y con las restricciones reales de infraestructura antes de implementar tecnologías adicionales.

## ADR-001 — Monolito modular como estilo arquitectónico

- **Estado:** Seleccionado para la primera versión.
- **Contexto:** El sistema reúne capacidades relacionadas: autenticación, publicación de ofertas, postulaciones, convenios, notificaciones e integración académica. El proyecto necesita límites claros, pero también una implementación y despliegue manejables.
- **Drivers relacionados:** DA01 — Centralización; DA04 — Evolución modular; DA05 — Comunicación estandarizada mediante API REST; DA06 — Mantenibilidad. Atributos AC01 y AC05.
- **Decisión:** Construir una única aplicación backend desplegable, organizada en módulos de negocio con interfaces internas explícitas. El portal web consumirá una API REST. Los módulos compartirán inicialmente PostgreSQL, con reglas de acceso y límites internos definidos.
- **Alternativas consideradas:** monolito tradicional sin límites modulares, monolito modular y microservicios.
- **Justificación:** ofrece menor complejidad de despliegue, pruebas y operación que los microservicios, sin renunciar a separar responsabilidades dentro del código.
- **Consecuencias positivas:** una primera versión más sencilla de construir y mantener; transacciones locales más simples; límites que pueden facilitar pruebas y evolución.
- **Costes y riesgos:** el backend se despliega como una unidad; un módulo mal diseñado puede acoplarse a otros; el escalamiento inicial suele ser de toda la aplicación.
- **Condición de revisión:** reconsiderar la extracción de un módulo a un servicio independiente solo si existen necesidades demostradas de escalamiento, despliegue autónomo, aislamiento o trabajo de equipos independientes.

## ADR-002 — Clean Architecture dentro del monolito modular

- **Estado:** Seleccionado como enfoque interno propuesto.
- **Contexto:** La evolución de los flujos de ofertas, postulaciones y convenios no debe acoplar las reglas del negocio a la interfaz web, al framework backend ni a la persistencia.
- **Drivers relacionados:** DA06 — Mantenibilidad; DA04 — Evolución modular. Atributo AC05.
- **Decisión:** Organizar el código con Dominio, Aplicación, Presentación e Infraestructura, conservando módulos de negocio identificables dentro de la misma aplicación. Las dependencias del código apuntan hacia el dominio y los casos de uso.
- **Alternativas consideradas:** capas tradicionales sin una regla estricta de dependencias; lógica de negocio dentro de controladores; arquitectura hexagonal.
- **Justificación:** permite probar las reglas sin levantar infraestructura y sustituir adaptadores técnicos con cambios localizados.
- **Consecuencias positivas:** menor acoplamiento, pruebas unitarias más simples y responsabilidades explícitas.
- **Costes y riesgos:** requiere disciplina en el diseño de interfaces y evita que se creen abstracciones sin una necesidad real.
- **Criterio de validación:** los casos de uso pueden probarse con dobles de prueba y el dominio no importa frameworks, ORM ni clientes externos.

## ADR-003 — Redis y RabbitMQ condicionados a evidencia

- **Estado:** Incorporación condicionada a validación.
- **Contexto:** se esperan picos estacionales de consulta de ofertas y el envío de notificaciones puede ser independiente de la respuesta inmediata al usuario.
- **Drivers relacionados:** DA02 — Picos de demanda estacionales; DA06 — Mantenibilidad. Atributos AC02 y AC05.
- **Decisión:** considerar Redis para datos de lectura frecuente y RabbitMQ para tareas asíncronas, como notificaciones, solo cuando los escenarios de carga o los requisitos operativos lo justifiquen.
- **Alternativas consideradas:** consultas directas a PostgreSQL y notificaciones síncronas en la primera versión.
- **Justificación:** caché y mensajería pueden reducir carga y desacoplar tareas, pero también introducen invalidación de caché, reintentos, monitoreo y consistencia eventual.
- **Consecuencias positivas:** potencial mejora de rendimiento y aislamiento de procesos lentos.
- **Costes y riesgos:** nueva infraestructura y posibles fallos de sincronización o entrega.
- **Criterio de validación:** documentar mediciones de latencia/carga y garantizar reintentos, idempotencia y trazabilidad antes de depender de mensajería.

## ADR-004 — Integración con SIGA mediante un adaptador

- **Estado:** Propuesto, sujeto a disponibilidad de acceso institucional.
- **Contexto:** RF04 requiere comprobar requisitos académicos de los estudiantes, mientras RC02 establece que el sistema no reemplaza al sistema académico institucional.
- **Drivers relacionados:** DA03 — Integración con sistemas legados; DA06 — Mantenibilidad.
- **Decisión:** encapsular la comunicación con SIGA detrás de una interfaz o puerto de aplicación y una implementación adaptadora en infraestructura.
- **Alternativas consideradas:** invocar la API externa directamente desde el caso de uso; duplicar localmente la lógica del sistema académico.
- **Justificación:** aísla cambios del contrato externo y evita que la lógica de negocio dependa de detalles específicos de SIGA.
- **Consecuencias positivas:** integración reemplazable y pruebas con respuestas simuladas.
- **Costes y riesgos:** es necesario gestionar indisponibilidad, tiempos de espera, errores y cambios de contrato del sistema externo.
- **Criterio de validación:** los casos de uso no importan SDK ni modelos específicos de SIGA; las fallas de integración se manejan explícitamente. Si no hay acceso, se documentará una alternativa temporal sin afirmar que la integración real está implementada.

## ADR-005 — Contratos, pruebas y documentación para mantenibilidad

- **Estado:** Propuesto.
- **Contexto:** el sistema debe poder evolucionar sin que un cambio local genere modificaciones innecesarias en otros módulos.
- **Drivers relacionados:** DA04 — Evolución modular; DA06 — Mantenibilidad. Atributo AC05.
- **Decisión:** definir interfaces entre módulos, mantener pruebas automatizadas de reglas de negocio y de integración, y registrar las decisiones que cambien los límites o dependencias del sistema.
- **Alternativas consideradas:** depender de convenciones no documentadas y validar cambios únicamente mediante pruebas manuales.
- **Justificación:** los contratos y las pruebas hacen más visible el impacto de un cambio y ayudan a prevenir regresiones.
- **Consecuencias positivas:** revisiones más claras, cambios más localizados y mayor confianza para refactorizar.
- **Costes y riesgos:** esfuerzo inicial para mantener pruebas y documentación actualizadas.
- **Criterios de validación:** reglas clave de postulación y permisos cubiertas por pruebas; contratos documentados; decisiones relevantes registradas en ADR.

## Resumen de trazabilidad

| Decisión | Drivers principales | Resultado esperado |
|---|---|---|
| ADR-001 Monolito modular | DA01, DA04, DA05, DA06 | Una aplicación desplegable con módulos y contratos internos claros. |
| ADR-002 Clean Architecture | DA06, DA04 | Dependencias dirigidas hacia dominio y aplicación. |
| ADR-003 Redis/RabbitMQ condicionados | DA02, DA06 | Optimización basada en mediciones y tareas asíncronas justificadas. |
| ADR-004 Adaptador SIGA | DA03, DA06 | Integración externa aislada y sujeta a acceso autorizado. |
| ADR-005 Contratos y pruebas | DA04, DA06 | Menos regresiones y mantenimiento más predecible. |
