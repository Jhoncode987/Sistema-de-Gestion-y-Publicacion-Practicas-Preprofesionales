# Registro de Decisiones Arquitectónicas (ADR)

Este documento registra las decisiones principales para el Sistema Web para la Gestión y Publicación de Prácticas Preprofesionales de la UNSCH. Las decisiones se derivan de los drivers y atributos documentados en `analisis-de-sistema/`.

> **Estado:** propuestas para la arquitectura del proyecto. Deben validarse con el equipo y con las restricciones reales de infraestructura antes de implementar tecnologías adicionales.

## ADR-001 — Monolito modular como estilo arquitectónico

- **Estado:** Seleccionado para la primera versión.
- **Contexto:** El sistema reúne capacidades relacionadas: autenticación, publicación de ofertas, postulaciones, convenios, notificaciones e integración académica. El proyecto necesita límites claros, pero también una implementación y despliegue manejables.
- **Drivers relacionados:** DA01 — Centralización; DA04 — Evolución modular; DA05 — Comunicación estandarizada mediante API REST; DA06 — Mantenibilidad. Atributos AC03.
- **Decisión:** Construir una única aplicación backend desplegable, organizada en módulos de negocio con interfaces internas explícitas. El portal web consumirá una API REST. Los módulos compartirán inicialmente PostgreSQL, con reglas de acceso y límites internos definidos.
- **Alternativas consideradas:** monolito tradicional sin límites modulares, monolito modular y microservicios.
- **Justificación:** ofrece menor complejidad de despliegue, pruebas y operación que los microservicios, sin renunciar a separar responsabilidades dentro del código.
- **Consecuencias positivas:** una primera versión más sencilla de construir y mantener; transacciones locales más simples; límites que pueden facilitar pruebas y evolución.
- **Costes y riesgos:** el backend se despliega como una unidad; un módulo mal diseñado puede acoplarse a otros; el escalamiento inicial suele ser de toda la aplicación.
- **Condición de revisión:** reconsiderar la extracción de un módulo a un servicio independiente solo si existen necesidades demostradas de escalamiento, despliegue autónomo, aislamiento o trabajo de equipos independientes.

## ADR-002 — Clean Architecture dentro del monolito modular

- **Estado:** Seleccionado como enfoque interno propuesto.
- **Contexto:** La evolución de los flujos de ofertas, postulaciones y convenios no debe acoplar las reglas del negocio a la interfaz web, al framework backend ni a la persistencia.
- **Drivers relacionados:** DA06 — Mantenibilidad; DA04 — Evolución modular. Atributo AC03.
- **Decisión:** Organizar el código con Dominio, Aplicación, Presentación e Infraestructura, conservando módulos de negocio identificables dentro de la misma aplicación. Las dependencias del código apuntan hacia el dominio y los casos de uso.
- **Alternativas consideradas:** capas tradicionales sin una regla estricta de dependencias; lógica de negocio dentro de controladores; arquitectura hexagonal.
- **Justificación:** permite probar las reglas sin levantar infraestructura y sustituir adaptadores técnicos con cambios localizados.
- **Consecuencias positivas:** menor acoplamiento, pruebas unitarias más simples y responsabilidades explícitas.
- **Costes y riesgos:** requiere disciplina en el diseño de interfaces y evita que se creen abstracciones sin una necesidad real.
- **Criterio de validación:** los casos de uso pueden probarse con dobles de prueba y el dominio no importa frameworks, ORM ni clientes externos.

## ADR-003 — PostgreSQL como única persistencia

- **Estado:** seleccionado para esta entrega.
- **Contexto:** carga académica objetivo de 20 y 25 usuarios simultáneos y necesidad de mantener el backend monolítico.
- **Drivers relacionados:** DA02; AC01 Rendimiento; RC05.
- **Decisión:** utilizar PostgreSQL para datos de negocio, avisos internos y auditoría. Optimizar filtros, índices y paginación; no incluir Redis, RabbitMQ, brokers, bases adicionales ni microservicios.
- **Alternativas consideradas:** caché externa y mensajería; se descartan del alcance de esta entrega.
- **Consecuencias:** menos componentes operativos; notificaciones y reportes se gestionan dentro del backend. La capacidad real se verifica mediante EQ-01 y EQ-02, no se presume.
- **Criterio de validación:** medir p95 y errores por separado con 20 y 25 usuarios simultáneos.

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
- **Drivers relacionados:** DA04 — Evolución modular; DA06 — Mantenibilidad. Atributo AC03.
- **Decisión:** definir interfaces entre módulos, mantener pruebas automatizadas de reglas de negocio y de integración, y registrar las decisiones que cambien los límites o dependencias del sistema.
- **Alternativas consideradas:** depender de convenciones no documentadas y validar cambios únicamente mediante pruebas manuales.
- **Justificación:** los contratos y las pruebas hacen más visible el impacto de un cambio y ayudan a prevenir regresiones.
- **Consecuencias positivas:** revisiones más claras, cambios más localizados y mayor confianza para refactorizar.
- **Costes y riesgos:** esfuerzo inicial para mantener pruebas y documentación actualizadas.
- **Criterios de validación:** reglas clave de postulación y permisos cubiertas por pruebas; contratos documentados; decisiones relevantes registradas en ADR.

## ADR-006 — Stack tecnológico: Node.js, Express, React y PostgreSQL

- **Estado:** seleccionado; implementado parcialmente (listado de ofertas).
- **Contexto:** la propuesta inicial dejaba pendiente el lenguaje y framework del backend. Para comenzar la implementación se necesitaba confirmar el stack, con un equipo pequeño y una infraestructura de bajo costo (RC04).
- **Drivers relacionados:** DA04 — Evolución modular; DA05 — Comunicación estandarizada mediante API REST; DA06 — Mantenibilidad; RC04.
- **Decisión:**
  - **Backend:** Node.js con Express 5, módulos CommonJS (`.cjs`), acceso a PostgreSQL con el cliente `pg` mediante SQL explícito (sin ORM) y configuración por variables de entorno (`dotenv`).
  - **Frontend:** React 19 con Vite, que consume la API REST bajo el prefijo `/api/v1`.
  - **Persistencia:** PostgreSQL con un esquema por módulo (hoy `ofertas`) y migraciones SQL versionadas en `backend/migrations`.
  - **Estructura del código:** `backend/src/modules/<modulo>/{dominio,aplicacion,infraestructura,presentacion}`, con el ensamblaje de dependencias en `backend/server.cjs`.
- **Alternativas consideradas:** frameworks con más estructura impuesta (por ejemplo NestJS o Spring Boot) y el uso de un ORM; se descartan por añadir más estructura y curva de aprendizaje de la que necesita un monolito de este tamaño.
- **Consecuencias positivas:** un solo lenguaje en frontend y backend; despliegue simple de una sola aplicación; el SQL es visible, lo que facilita revisar las restricciones de integridad (por ejemplo la unicidad de RF05).
- **Costes y riesgos:** Express no impone estructura, por lo que los límites entre módulos y la regla de dependencias se mantienen por convención y revisión; sin ORM, el mapeo de datos y las migraciones son manuales; aún no existen pruebas automatizadas.
- **Criterio de validación:** cada módulo respeta la estructura de carpetas; la capa de aplicación no importa `express` ni `pg`; los casos de uso se prueban con un repositorio simulado (pendiente).

## ADR-007 — Bumeran como referencia funcional, sin integración

- **Estado:** aceptado.
- **Contexto:** la docente pidió usar Bumeran como referencia para la arquitectura. Se evaluó además usar sus avisos como fuente de ofertas para el sistema.
- **Decisión:** Bumeran se usa solo como referencia funcional (cuentas de candidato y empresa, publicación de avisos, búsqueda con filtros, postulación y alertas). El sistema no importa ni consulta datos de Bumeran.
- **Alternativas consideradas:** importar avisos de Bumeran. Se descarta porque, según la información disponible, Bumeran no ofrece una API pública para consultar ofertas, por lo que habría que extraer datos de su sitio web; porque las ofertas importadas no pasarían por la validación del coordinador (RF01) ni por la comprobación de elegibilidad con SIGA (RC02); y porque la postulación ocurriría fuera del sistema, sin seguimiento.
- **Consecuencias:** las empresas y ofertas se registran directamente en el sistema y las valida el coordinador. Si en el futuro existe un acuerdo autorizado con un portal externo, se integraría mediante un puerto y un adaptador, como se hace con SIGA (ADR-004).
- **Criterio de validación:** ningún módulo del código depende de un servicio externo de ofertas.

## ADR-008 — Autenticación propia con contraseñas con hash y tokens firmados

- **Estado:** aceptado.
- **Contexto:** el sistema distingue tres roles (estudiante, empresa y coordinador) y las rutas de negocio deben protegerse por rol (seguridad, DA05).
- **Decisión:** el módulo Identidad guarda las cuentas en su propio esquema (`identidad`). Las contraseñas se guardan con scrypt y sal aleatoria, nunca en claro. La sesión es un token JWT (HS256) de 8 horas, firmado con `JWT_SECRET`, que viaja en la cabecera `Authorization: Bearer`. El token se implementa con `node:crypto`, sin dependencias nuevas. Estudiantes y empresas se registran desde el portal; el coordinador solo se crea con un script administrativo. El inicio de sesión limita los intentos fallidos por correo (5 cada 15 minutos) y responde igual ante correo inexistente o clave incorrecta.
- **Alternativas consideradas:** Passport, bcrypt y jsonwebtoken (más conocidas, pero añaden dependencias para algo pequeño); sesiones en base de datos (permiten revocar al instante, pero añaden una consulta por solicitud); inicio de sesión institucional (no hay acceso autorizado a un proveedor de identidad de la UNSCH).
- **Consecuencias:** un token no se puede revocar antes de vencer, salvo desactivar la cuenta, que se comprueba en `/auth/yo`. El limitador es en memoria: se reinicia con el servidor y no se comparte entre instancias. El rol viaja dentro del token; los casos de uso sensibles deben volver a comprobarlo contra la base de datos cuando se implemente la validación del coordinador.
- **Criterio de validación:** pruebas automáticas de hash, token manipulado o vencido, bloqueo por intentos y acceso denegado por rol.

## Resumen de trazabilidad

| Decisión | Drivers principales | Resultado esperado |
|---|---|---|
| ADR-001 Monolito modular | DA01, DA04, DA05, DA06 | Una aplicación desplegable con módulos y contratos internos claros. |
| ADR-002 Clean Architecture | DA06, DA04 | Dependencias dirigidas hacia dominio y aplicación. |
| ADR-003 PostgreSQL único | DA02 | Backend monolítico sin persistencia ni mensajería adicional; medir con 20 y 25 usuarios. |
| ADR-004 Adaptador SIGA | DA03, DA06 | Integración externa aislada y sujeta a acceso autorizado. |
| ADR-005 Contratos y pruebas | DA04, DA06 | Menos regresiones y mantenimiento más predecible. |
| ADR-006 Stack Node.js, Express, React y PostgreSQL | DA04, DA05, DA06 | Stack confirmado; estructura por módulo y SQL explícito. |
| ADR-007 Bumeran como referencia funcional | RF01, RC02 | No se integra con portales externos; las ofertas se validan en el sistema. |
| ADR-008 Autenticación con hash y token firmado | DA05 | Rutas protegidas por rol; contraseñas nunca en claro. |
