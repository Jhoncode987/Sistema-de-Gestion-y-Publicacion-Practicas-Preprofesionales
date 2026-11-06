# Diseño interno del sistema de prácticas preprofesionales UNSCH

**Estado:** propuesta de diseño para el Sprint 01. Este documento describe responsabilidades, interfaces y flujos previstos; no afirma que estas clases o módulos estén implementados. Los nombres son conceptuales y podrán ajustarse cuando se confirme la tecnología del backend.

## 1. Propósito y alcance

Este documento concreta cómo se organizará internamente el **Sistema Web para la Gestión y Publicación de Prácticas Preprofesionales de la UNSCH**, con foco en el módulo de **Postulaciones**. Se adopta un monolito modular con API REST y Clean Architecture: una sola aplicación desplegable, dividida en módulos de negocio con responsabilidades claras.

El diseño se limita al backend y a sus interacciones principales. React, PostgreSQL, JWT, el adaptador de SIGA y el proveedor de correo son propuestas o decisiones sujetas a validación; no se presentan como integraciones ya desplegadas. La integración académica depende de autorización institucional (RC02, DA03). La nube queda fuera del alcance de este sprint.

## 2. Capas y responsabilidades

| Capa propuesta | Responsabilidad | Ejemplos del módulo Postulaciones |
|---|---|---|
| Presentación / entrada | Recibir solicitudes HTTP, aplicar validaciones de formato, delegar al caso de uso y traducir resultados a respuestas HTTP. | PostulacionesController, DTO de entrada y salida. |
| Aplicación | Coordinar los pasos de un caso de uso y definir los puertos que necesita. | RegistrarPostulacion, ConsultarPostulaciones, CambiarEstadoPostulacion. |
| Dominio | Representar conceptos del negocio y proteger reglas e invariantes que no dependen de tecnología. | Postulacion, estados permitidos y reglas de transición. |
| Infraestructura / salida | Implementar persistencia y comunicación con servicios externos mediante adaptadores. | Repositorios PostgreSQL y adaptador del verificador académico. |

**Regla de dependencias:** presentación e infraestructura pueden depender de aplicación/dominio; las reglas de negocio no deben depender directamente del framework web, PostgreSQL ni del cliente de SIGA. Los puertos se definen en el lado interno y los adaptadores implementan esos contratos.

## 3. Módulos del sistema y trazabilidad

| Módulo lógico | Responsabilidad principal | Requisitos relacionados |
|---|---|---|
| Usuarios y Autenticación | Identidad, roles y permisos para estudiante, empresa, coordinador y administrador. | RF08, RF09; AC03 |
| Ofertas | Registro/validación de empresas y publicación, edición, cierre y consulta de ofertas. | RF01, RF02, RF03; HU-01 a HU-04 |
| Postulaciones | Validar elegibilidad, evitar duplicados y permitir consultar estados. | RF04, RF05, RF06; HU-05, HU-06 |
| Convenios | Seguimiento de estados del convenio y de la práctica. | RF06, RF10; HU-06 |
| Notificaciones | Preparar avisos por nuevas ofertas, cambios de estado y validaciones pendientes. | RF07; HU-07 |
| Integración Académica | Consultar datos de elegibilidad a través de un contrato interno. | RF04, RC02, DA03 |
| Reportes y Auditoría | Registrar acciones administrativas y preparar reportes por periodo/carrera. | RF09, RF10 |

Los módulos son límites lógicos dentro del mismo backend; no son microservicios independientes (AC01, DA04). Las operaciones entre módulos deben utilizar interfaces o servicios de aplicación definidos, evitando acceder directamente a sus estructuras internas.

## 4. Diseño interno del módulo Postulaciones

### 4.1 Componentes propuestos

| Componente | Responsabilidad | Trazabilidad |
|---|---|---|
| PostulacionesController | Recibir la petición, obtener la identidad autenticada, validar el formato y devolver una respuesta HTTP. No contiene las reglas centrales del negocio. | RF04–RF06, RF08, DA05 |
| RegistrarPostulacion | Coordinar consulta de oferta, validación de elegibilidad, comprobación de duplicados y registro. | RF04, RF05, DA04, DA06 |
| ConsultarPostulaciones | Obtener las postulaciones del estudiante autenticado o las que el coordinador tenga permiso de supervisar. | RF06, RF08 |
| CambiarEstadoPostulacion | Validar que el actor tenga permiso y que el cambio de estado sea válido. | RF06, RF08, RF09 |
| Postulacion | Entidad de dominio que representa la postulación y protege las transiciones de estado válidas. | RF05, RF06, AC05 |
| OfertaRepository (puerto) | Definir operaciones de consulta de ofertas necesarias para el caso de uso. | RF02–RF04, DA06 |
| PostulacionRepository (puerto) | Definir operaciones para comprobar y registrar una postulación y consultar su estado. | RF05, RF06, DA06 |
| VerificadorElegibilidad (puerto) | Abstraer la validación de créditos/ciclo u otros criterios académicos definidos para una oferta. | RF04, RC02, DA03 |
| Adaptadores de persistencia | Implementar los puertos usando la base de datos seleccionada. | RF04–RF06, AC05 |
| Adaptador académico | Traducir el contrato interno a la interfaz de SIGA, si la universidad autoriza el acceso. | RF04, RC02, DA03 |

### 4.2 Entidades y conceptos del dominio

| Concepto | Datos o comportamiento conceptual |
|---|---|
| Postulacion | Identificador, estudiante, oferta, fecha de registro y estado. Debe mantener la relación entre un estudiante y una oferta sin duplicidad. |
| Oferta | Identificador, carrera, ciclo mínimo, modalidad, vacantes, fecha límite y estado de publicación. La oferta debe estar vigente y admitir postulaciones. |
| EstadoPostulacion | Conjunto controlado de estados de la postulación. Los estados concretos y transiciones deberán alinearse con el flujo aprobado por el curso y la oficina responsable. |
| ResultadoElegibilidad | Resultado de la consulta académica, incluyendo si el estudiante cumple los criterios y, cuando corresponda, un motivo comprensible de rechazo o indisponibilidad. |

Los campos son conceptuales; el modelo definitivo deberá validarse con las historias y las reglas del negocio. No se fija aquí un esquema físico de tablas.

### 4.3 Reglas e invariantes

1. Un estudiante solo puede postular a una oferta si cumple los criterios académicos requeridos (RF04).
2. No puede existir más de una postulación para la misma combinación estudiante–oferta (RF05).
3. La oferta debe existir, estar publicada y encontrarse dentro de su periodo de postulación (RF02, RF04).
4. El estudiante solo consulta sus propias postulaciones; coordinadores y administradores operan según sus permisos (RF06, RF08).
5. Los cambios administrativos relevantes deben quedar auditados (RF09).
6. La indisponibilidad de SIGA no debe interpretarse automáticamente como que el estudiante es elegible. El sistema debe comunicar que no pudo completar la validación y aplicar una política de reintento o atención manual que deberá aprobarse institucionalmente (RF04, RC02, DA03).
7. La prevención de duplicados debe proteger también las escrituras concurrentes. No basta con consultar primero si existe una postulación: la persistencia debe imponer una restricción única sobre estudiante y oferta o aplicar un mecanismo transaccional equivalente.

## 5. Interfaces y puertos

| Puerto / interfaz propuesta | Operaciones conceptuales | Por qué se define |
|---|---|---|
| OfertaRepository | buscarPorId(ofertaId) | El caso de uso consulta la oferta sin conocer el motor de base de datos. |
| PostulacionRepository | existeParaEstudianteYOferta(estudianteId, ofertaId), guardar(postulacion), listarPorEstudiante(estudianteId) | Separa reglas de aplicación de la persistencia y facilita pruebas. |
| VerificadorElegibilidad | verificar(estudianteId, oferta) | Evita que las reglas del negocio dependan del cliente o formato de respuesta de SIGA. |
| ServicioNotificaciones | notificarCambioEstado(...), notificarNuevaOferta(...) | Permite cambiar el proveedor de correo sin modificar los casos de uso. |
| AuditoriaRepository | registrar(actor, accion, recurso, fecha) | Facilita la trazabilidad de acciones administrativas sensibles. |

Los nombres de métodos son ilustrativos. Los contratos definitivos deben especificar errores, validaciones, permisos y resultados esperados.

## 6. Diagramas de secuencia

### 6.1 Registrar una postulación

~~~mermaid
sequenceDiagram
    actor Estudiante
    participant API as PostulacionesController
    participant UC as RegistrarPostulacion
    participant OR as OfertaRepository
    participant VE as VerificadorElegibilidad
    participant PR as PostulacionRepository
    participant DB as Base de datos

    Estudiante->>API: POST /postulaciones
    API->>API: Autenticar y autorizar
    API->>UC: ejecutar(estudianteId, ofertaId)
    UC->>OR: buscarPorId(ofertaId)
    OR-->>UC: oferta
    UC->>VE: verificar(estudianteId, oferta)
    VE-->>UC: resultado de elegibilidad
    UC->>PR: existeParaEstudianteYOferta(...)
    PR-->>UC: no existe
    UC->>PR: guardar(postulacion)
    PR->>DB: INSERT con protección de unicidad
    DB-->>PR: resultado
    PR-->>UC: postulación registrada
    UC-->>API: resultado exitoso
    API-->>Estudiante: 201 Created
~~~

**Alternativas que también deben probarse:** oferta inexistente o cerrada; estudiante no elegible; postulación previa; falta de permisos; error de base de datos; SIGA no disponible; conflicto de unicidad por dos solicitudes simultáneas. En cada caso, la API debe devolver un resultado controlado y no registrar una postulación inválida.

### 6.2 Validar una empresa y publicar una oferta

~~~mermaid
sequenceDiagram
    actor Empresa
    participant API as API REST
    participant UC as Caso de uso de validación/publicación
    participant Repo as Repositorio de ofertas
    participant Audit as Servicio de auditoría
    participant Notif as Servicio de notificaciones

    Empresa->>API: Solicita publicar oferta
    API->>API: Autenticar y verificar rol
    API->>UC: procesar solicitud
    UC->>Repo: consultar estado de empresa
    Repo-->>UC: estado de validación
    alt Empresa no validada
        UC-->>API: publicación no permitida
        API-->>Empresa: Respuesta de rechazo
    else Empresa validada
        UC->>Repo: guardar oferta
        Repo-->>UC: oferta registrada
        UC->>Audit: registrar acción relevante
        UC->>Notif: solicitar aviso, si aplica
        UC-->>API: oferta registrada
        API-->>Empresa: Respuesta exitosa
    end
~~~

Este flujo es conceptual: la validación de la empresa por el coordinador y la publicación por la empresa deben modelarse como operaciones separadas en la implementación para evitar que una empresa apruebe su propio registro (RF01, RF08, RF09). El servicio de notificaciones es una abstracción; no se ha elegido proveedor.

## 7. Seguridad y autorización

- **Autenticación:** se propone autenticar a los usuarios antes de permitir operaciones protegidas. El uso de JWT es una propuesta descrita en AC03, no una implementación confirmada.
- **Autorización por rol y propiedad:** el servidor debe validar permisos en cada operación. La interfaz web no es una frontera de seguridad.
- **Estudiantes:** solo pueden consultar sus datos y registrar postulaciones en su nombre.
- **Empresas:** solo pueden administrar su propio perfil y sus ofertas, dentro de los estados y permisos habilitados.
- **Coordinadores:** pueden revisar registros/ofertas y supervisar convenios conforme a las responsabilidades institucionales.
- **Administradores:** pueden administrar roles y realizar acciones autorizadas; las operaciones sensibles deben auditarse.
- **Integración académica:** credenciales y configuración de SIGA, si se autorizan, se mantienen fuera del código fuente y no se exponen al cliente.
- **Validación de entradas:** validar identificadores, fechas, estados y contenido recibido; no confiar en valores de rol enviados por el navegador.
- **Auditoría:** registrar actor, acción, recurso afectado, fecha y resultado relevante sin guardar contraseñas, tokens ni secretos (RF09).
- **Errores:** evitar que respuestas HTTP filtren credenciales, datos personales innecesarios o detalles internos de infraestructura.

Trazabilidad principal: RF08, RF09, AC03, RC02 y DA03.

## 8. Principios y patrones de diseño

### Principios

- **Responsabilidad única:** controladores gestionan HTTP; casos de uso coordinan operaciones; entidades protegen reglas; adaptadores resuelven detalles técnicos.
- **Inversión de dependencias:** aplicación depende de puertos internos, no de implementaciones concretas de base de datos o servicios externos.
- **Separación de responsabilidades:** cada módulo expone contratos acotados y evita modificar datos internos de otro módulo directamente.
- **Diseño para pruebas:** los casos de uso se prueban con implementaciones simuladas de repositorios y servicios.
- **Evitar sobreingeniería:** no introducir microservicios, Redis, RabbitMQ ni patrones adicionales sin una necesidad demostrable (AC01, AC02, DA02, DA04, DA06).

### Patrones aplicables

| Patrón | Aplicación prevista | Beneficio / precaución |
|---|---|---|
| Repository | Puertos para consultar y guardar ofertas y postulaciones. | Aísla persistencia; no debe convertirse en una capa genérica sin propósito. |
| Adapter | Adaptador académico para traducir el contrato interno a SIGA; adaptadores para persistencia y correo. | Reduce acoplamiento con servicios externos. SIGA solo se implementa con autorización. |
| DTO | Objetos específicos para solicitudes y respuestas HTTP. | Evita exponer entidades internas y permite controlar datos transferidos. |
| Strategy (opcional) | Si se confirman varios métodos de validación de elegibilidad o reglas variables por convocatoria. | Incorporarlo solo si hay variaciones reales; no se necesita anticipar todas las posibilidades. |
| Inyección de dependencias | Conectar casos de uso con puertos y adaptadores. | Facilita sustitución de dependencias y pruebas. |

No se propone Decorator para caché ni Observer/RabbitMQ como parte obligatoria del diseño base. La asincronía y el caché se evaluarán mediante mediciones (AC02, DA02).

## 9. Estrategia de pruebas

| Tipo de prueba | Qué verificar | Requisitos / calidad |
|---|---|---|
| Unitarias de dominio | Transiciones de estado válidas, reglas de oferta y comportamiento de Postulacion. | RF02, RF05, RF06; AC05 |
| Unitarias de aplicación | Elegibilidad, duplicados, permisos requeridos y errores usando puertos simulados. | RF04–RF06, RF08; AC05 |
| Integración de persistencia | Guardado/consulta, transacciones y restricción única estudiante–oferta. | RF05, AC03, AC05 |
| Contrato de integración | Traducción de respuestas, errores y tiempos de espera del adaptador académico. | RF04, RC02, DA03 |
| Seguridad | Acceso denegado por rol incorrecto, intento de consultar postulaciones ajenas y protección de endpoints. | RF08, RF09, AC03 |
| Integración de notificaciones | Solicitud de avisos por nuevos anuncios y cambios de estado; manejo de fallos del proveedor. | RF07, AC02 |
| Rendimiento | Medir latencia y errores de búsqueda y postulación bajo la carga acordada. | AC02 y escenarios de calidad |
| Regresión de módulos | Cambios locales no rompen contratos de otros módulos. | AC01, AC05, DA04, DA06 |

Los umbrales de rendimiento deben tomarse de 08-escenarios-atributos-calidad.md y tratarse como objetivos de prueba, no como resultados ya alcanzados. El documento de diseño no afirma que estas pruebas se hayan ejecutado.

## 10. Trazabilidad resumida

| Decisión o elemento | Origen que la justifica |
|---|---|
| Portal web y API REST | DA01, DA05; RF01–RF10 |
| Monolito modular y módulos de negocio | AC01, DA04 |
| Clean Architecture y puertos/adaptadores | AC05, DA06 |
| Control de roles y propiedad de los datos | RF08, AC03 |
| Registro de auditoría | RF09 |
| Verificación académica mediante adaptador | RF04, RC02, DA03 |
| Prevención de postulación duplicada | RF05 |
| Notificaciones desacopladas | RF07, AC02 |
| Medición antes de añadir caché o mensajería | AC02, DA02 |
| Despliegue en infraestructura universitaria o nube académica de bajo costo como posibilidad | RC04; el despliegue en nube se documentará posteriormente |

## 11. Supuestos, límites y pendientes

1. Este documento define un diseño propuesto, no código ejecutable ni evidencia de funcionalidades terminadas.
2. React y PostgreSQL son tecnologías propuestas en la documentación de arquitectura; se deben confirmar contra la implementación antes de presentarlas como stack definitivo.
3. El acceso a SIGA requiere autorización institucional. Sin ella, se debe acordar una alternativa operativa para validar elegibilidad; no se debe simular una validación exitosa.
4. El proveedor de correo no está seleccionado.
5. Redis, RabbitMQ y microservicios no forman parte de la solución base.
6. La nube y el despliegue se tratarán en una etapa posterior.
7. Antes de implementar, se deben confirmar con los responsables las transiciones de estado de postulaciones/convenios, los criterios académicos exactos y los permisos detallados por rol.

## Referencias internas

- [Historias de usuario](../../01-analisis-de-sistema/02-historias-del-usuario.md)
- [Requisitos funcionales](../../01-analisis-de-sistema/03-requisitos-funcionales.md)
- [Atributos de calidad](../../01-analisis-de-sistema/04-atributos-de-calidad.md)
- [Restricciones](../../01-analisis-de-sistema/05-restricciones.md)
- [Drivers arquitectónicos](../../01-analisis-de-sistema/06-driver-arquitectonicos.md)
- [Escenarios de atributos de calidad](../../01-analisis-de-sistema/08-escenarios-atributos-calidad.md)
- [Diagramas C4](../../02-arquitectura/diagramas-c4/diagramas-c4.md)
