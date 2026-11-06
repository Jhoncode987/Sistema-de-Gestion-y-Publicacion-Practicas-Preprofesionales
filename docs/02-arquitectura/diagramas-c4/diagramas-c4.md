# Diagramas C4 — Sistema de Prácticas Preprofesionales UNSCH

**Estado:** propuesta arquitectónica para el Sprint 01. Los diagramas describen el diseño previsto, no una implementación ya desplegada.

## Convenciones y trazabilidad

- **RF:** requisito funcional de `../01-analisis-de-sistema/03-requisitos-funcionales.md`.
- **AC:** atributo de calidad de `../01-analisis-de-sistema/04-atributos-de-calidad.md`.
- **RC:** restricción de `../01-analisis-de-sistema/05-restricciones.md`.
- **DA:** driver arquitectónico de `../01-analisis-de-sistema/06-driver-arquitectonicos.md`.

Se mantiene un backend como monolito modular. Los módulos son límites lógicos dentro de la aplicación, no microservicios independientes.

---

## C1 — Diagrama de contexto

**Propósito:** mostrar quién utiliza el sistema y con qué sistemas externos se relaciona, sin revelar todavía los componentes internos.

```mermaid
flowchart LR
    Est["Estudiante"]
    Emp["Empresa"]
    Coord["Coordinador de prácticas"]
    Admin["Administrador"]
    Oficina["Oficina de Prácticas Preprofesionales"]
    Sistema["Sistema Web para la Gestión y Publicación de Prácticas Preprofesionales de la UNSCH"]
    SIGA["Sistema académico institucional (SIGA)"]

    Est -->|"Busca ofertas, postula y consulta estados"| Sistema
    Emp -->|"Gestiona perfil y publica ofertas"| Sistema
    Coord -->|"Valida empresas/ofertas y supervisa convenios"| Sistema
    Admin -->|"Administra roles y revisa auditoría"| Sistema
    Oficina -->|"Consulta información y reportes"| Sistema
    Sistema -.->|"Consulta elegibilidad, si hay acceso autorizado"| SIGA
```

### Justificación de los elementos de C1

| Elemento o relación | Origen | Justificación |
|---|---|---|
| Estudiante | HU-04, HU-05, HU-06; RF03–RF06 | Busca ofertas, postula y consulta el estado de sus procesos. |
| Empresa | HU-01, HU-03; RF01–RF02 | Se registra y gestiona ofertas de prácticas. |
| Coordinador de prácticas | HU-02, HU-06; RF01, RF06, RF09 | Valida registros/ofertas y supervisa convenios y acciones administrativas. |
| Administrador | RF08–RF09 | Gestiona permisos y revisa acciones administrativas. |
| Oficina de Prácticas | RF10 | Consume reportes y vistas generales. |
| SIGA | RF04, RC02, DA03 | Fuente potencial de datos de elegibilidad; la integración depende de autorización institucional. |

**Nota:** SIGA se muestra como integración prevista y sujeta a autorización; los avisos son internos y persisten en PostgreSQL. No se afirma que exista una integración implementada. Si la solución institucional no autoriza acceso a SIGA, la integración debe quedar documentada como pendiente y definirse una alternativa.

---

## C2 — Diagrama de contenedores

**Propósito:** mostrar las aplicaciones ejecutables y almacenes de datos, sus responsabilidades y tecnologías propuestas. En C4, “contenedor” no significa necesariamente un contenedor Docker.

```mermaid
flowchart TB
    Users["Estudiantes, empresas, / coordinadores y administradores"]
    Office["Oficina de Prácticas"]

    subgraph System["Sistema Web de Prácticas Preprofesionales UNSCH"]
        Web["Portal web / React (propuesto) / Interfaz de usuario"]
        API["Backend / API REST / Monolito modular / Clean Architecture"]
        DB[("Base de datos relacional / PostgreSQL (propuesto)")]
    end

    SIGA["SIGA / sistema académico / (integración sujeta a autorización)"]

    Users -->|"HTTPS"| Web
    Office -->|"HTTPS"| Web
    Web -->|"HTTPS, JSON"| API
    API -->|"SQL / transacciones"| DB
    API -.->|"Consulta de elegibilidad mediante adaptador"| SIGA
```

### Relación del C2 con la referencia funcional Bumeran

Bumeran es una referencia funcional, no un servicio conectado al sistema UNSCH. El diagrama conserva nuestros contenedores y tecnologías; no afirma cómo se implementa Bumeran internamente.

| Flujo funcional de referencia | Contenedor de nuestra propuesta | Responsabilidad |
|---|---|---|
| Formularios de candidato/empresa, listado de avisos y seguimiento | Portal React | Presentar las pantallas y enviar solicitudes. |
| Publicación de avisos, recepción de candidaturas y evaluación empresarial | Backend monolítico / API REST | Ejecutar casos de uso mediante los siete módulos originales. |
| Necesidad de conservar información de esos procesos | PostgreSQL | Persistencia elegida por el proyecto UNSCH; no se atribuye ese motor a Bumeran. |

Las reglas de aprobación del coordinador, verificación académica y convenio son extensiones institucionales. Las rutas de [nuestra API REST](../api-rest.md) se diseñan para esos flujos; no son endpoints oficiales de Bumeran.

### Responsabilidad de cada contenedor

| Contenedor | Responsabilidad | Origen / justificación |
|---|---|---|
| Portal web React (propuesto) | Interfaz para cada tipo de usuario; presenta ofertas, formularios y estados. | DA01, DA05 y RF01–RF10. La tecnología es una propuesta, no una confirmación del stack implementado. |
| Backend / API REST | Autorización, reglas de negocio, casos de uso y contratos HTTP. | RF01–RF10, DA01, DA04 y DA05. |
| PostgreSQL (propuesto) | Persistir usuarios, ofertas, postulaciones, convenios y auditoría. | RF01–RF10; la selección de motor es una decisión arquitectónica propuesta. |
| SIGA externo | Proveer información académica para validar elegibilidad, si existe acceso autorizado. | RF04, RC02, DA03. |

### Módulos lógicos dentro del backend

- Usuarios y Autenticación — RF08 y RF09.
- Ofertas — RF01, RF02 y RF03.
- Postulaciones — RF04, RF05 y RF06.
- Convenios — RF06 y RF10.
- Notificaciones — RF07.
- Integración Académica — RF04, RC02 y DA03.
- Reportes y Auditoría — RF09 y RF10.

Estos módulos se ejecutan dentro de un solo backend desplegable (ADR-001). PostgreSQL es la única base; no se incorporan Redis, RabbitMQ ni servicios adicionales en el C2 base. El backend conserva los siete módulos originales.

---

## C3 — Componentes del contenedor Backend / API REST

**Propósito:** ampliar el backend y mostrar los componentes principales y sus relaciones. El ejemplo se centra en el caso de uso de postulación porque incluye reglas de elegibilidad y prevención de duplicados.

```mermaid
flowchart TB
    HTTP["Controlador REST / PostulacionesController"]
    UC["Caso de uso / RegistrarPostulacion"]
    OfferPort["Puerto de consulta / ConsultaOfertas"]
    AppPort["Puerto de persistencia / PostulacionRepository"]
    EligibilityPort["Puerto académico / VerificadorElegibilidad"]
    Domain["Dominio / Postulacion + reglas de estado"]
    OfferAdapter["Fachada pública / Módulo Ofertas"]
    AppAdapter["Adaptador de postulaciones / Repositorio PostgreSQL"]
    AcademicAdapter["Adaptador SIGA / (si está autorizado)"]
    DB[("PostgreSQL")]
    SIGA["Sistema académico SIGA"]

    HTTP -->|"Invoca"| UC
    UC -->|"Verifica reglas"| Domain
    UC --> OfferPort
    UC --> AppPort
    UC --> EligibilityPort
    OfferAdapter -.->|"Implementa"| OfferPort
    AppAdapter -.->|"Implementa"| AppPort
    AcademicAdapter -.->|"Implementa"| EligibilityPort
    OfferAdapter --> OfferPrivate["Repositorio privado de Ofertas"]
    OfferPrivate --> DB
    AppAdapter --> DB
    AcademicAdapter -.-> SIGA
```

### Responsabilidad y trazabilidad de componentes

| Componente | Responsabilidad | Requisito / driver |
|---|---|---|
| PostulacionesController | Recibir la petición HTTP, validar formato y mapear la respuesta; no contiene reglas de negocio centrales. | RF04–RF06, DA05. |
| RegistrarPostulacion | Coordinar elegibilidad, comprobación de duplicados y registro de la postulación. | RF04, RF05; DA04 y DA06. |
| Dominio Postulacion | Representar la postulación y sus reglas válidas de estado. | RF05–RF06; AC03. |
| ConsultaOfertas (contrato público) | Consultar requisitos/vigencia mediante la fachada de Ofertas, sin acceder a su repositorio privado. | RF02–RF04; DA06. |
| PostulacionRepository (puerto) | Definir operaciones para comprobar y guardar postulaciones. | RF05–RF06; AC03. |
| VerificadorElegibilidad (puerto) | Abstraer la comprobación de créditos/ciclo u otros criterios académicos. | RF04, RC02, DA03. |
| Adaptadores PostgreSQL | Implementar persistencia privada de cada módulo. | RF01–RF10; decisión de persistencia. |
| Adaptador SIGA | Traducir el contrato interno a la integración externa, si es autorizada. | RF04, RC02, DA03. |

**Regla de integridad:** la prevención de duplicados no debe depender únicamente de una comprobación previa en el caso de uso. La implementación debe proteger también la escritura frente a solicitudes concurrentes, por ejemplo con una restricción única sobre estudiante y oferta y manejo controlado del conflicto.

---

## C4 — Diagrama de código del componente RegistrarPostulacion

**Propósito:** mostrar las clases e interfaces principales que implementan el caso de uso. Es un diseño conceptual; los nombres pueden ajustarse cuando se confirme el lenguaje y framework del backend.

```mermaid
classDiagram
    class PostulacionesController {
        +registrar(solicitud)
    }
    class RegistrarPostulacion {
        +ejecutar(comando)
    }
    class Postulacion {
        +id
        +estudianteId
        +ofertaId
        +estado
        +crear()
    }
    class ConsultaOfertas {
        <<interface>>
        +buscarPorId(ofertaId)
    }
    class PostulacionRepository {
        <<interface>>
        +existeParaEstudianteYOferta(estudianteId, ofertaId)
        +guardar(postulacion)
    }
    class VerificadorElegibilidad {
        <<interface>>
        +esElegible(estudianteId, oferta)
    }
    class FachadaOfertas {
        +buscarPorId(ofertaId)
    }
    class PostulacionRepositoryPostgres {
        +existeParaEstudianteYOferta(estudianteId, ofertaId)
        +guardar(postulacion)
    }
    class VerificadorElegibilidadSIGA {
        +esElegible(estudianteId, oferta)
    }

    PostulacionesController --> RegistrarPostulacion
    RegistrarPostulacion --> ConsultaOfertas
    RegistrarPostulacion --> PostulacionRepository
    RegistrarPostulacion --> VerificadorElegibilidad
    RegistrarPostulacion --> Postulacion
    FachadaOfertas ..|> ConsultaOfertas
    PostulacionRepositoryPostgres ..|> PostulacionRepository
    VerificadorElegibilidadSIGA ..|> VerificadorElegibilidad
```

### Flujo resumido del caso de uso

1. El controlador recibe la solicitud autenticada del estudiante.
2. El caso de uso busca la oferta y comprueba que exista y admita postulaciones.
3. Consulta la elegibilidad mediante `VerificadorElegibilidad`; el adaptador SIGA es una implementación prevista, condicionada a autorización y disponibilidad.
4. Comprueba si ya existe una postulación para el mismo estudiante y oferta.
5. Crea la entidad de dominio y solicita guardarla.
6. La persistencia aplica la protección contra duplicados concurrentes y el sistema devuelve un resultado claro.

### Aplicación de Clean Architecture y SOLID

- **Inversión de dependencias:** el caso de uso depende de interfaces, no de clases PostgreSQL o del cliente SIGA.
- **Responsabilidad única:** el controlador gestiona HTTP; el caso de uso coordina la operación; la entidad protege reglas de dominio; los adaptadores resuelven detalles técnicos.
- **Sustitución de implementaciones:** repositorios o verificador pueden sustituirse por dobles de prueba.
- **Pruebas:** el caso de uso debe poder probarse con repositorios simulados, sin conectar a la base de datos real ni a SIGA.

## Matriz de trazabilidad resumida

| Elemento arquitectónico | Requisitos | Calidad / restricción / driver |
|---|---|---|
| Portal web | RF01–RF10 | DA01, DA05, RF03 |
| API REST | RF01–RF10 | DA01, DA05, AC02, AC03 |
| Autenticación y roles | RF08 | AC02 |
| Módulo Ofertas | RF01–RF03 | AC01, RF03 |
| Módulo Postulaciones | RF04–RF06 | AC01, AC02, AC03 |
| Módulo Convenios | RF06, RF10 | RF03, AC03 |
| Módulo Notificaciones | RF07 | AC01 |
| Reportes y auditoría | RF09–RF10 | AC02, RF03 |
| PostgreSQL | RF01–RF10, según los datos persistidos | AC01, AC03 |
| Adaptador SIGA | RF04 | RC02, DA03 |
| Interfaces de repositorio | RF04–RF06 | DA04, DA06, AC03 |
| Protección contra duplicados | RF05 | Integridad de datos |

## Decisiones y límites conocidos

1. La arquitectura seleccionada es monolito modular con API REST y Clean Architecture; no se proponen microservicios en esta etapa.
2. React y PostgreSQL son tecnologías propuestas en los documentos. Deben contrastarse con el repositorio de código antes de presentarlas como implementación.
3. La integración con SIGA depende de acceso autorizado; las notificaciones base son internas en PostgreSQL.
4. El despliegue en nube se documentará en una etapa posterior, tal como se acordó para el proyecto.
5. Los diagramas C1–C4 mantienen el mismo límite de sistema, los mismos actores y nombres coherentes entre niveles.

## Aclaración de los límites del diseño

Se mantienen Usuarios y Autenticación, Ofertas, Postulaciones, Convenios, Notificaciones, Integración Académica y Reportes y Auditoría. El perfil empresarial y su aprobación pertenecen a Ofertas; Usuarios administra sus credenciales. Convenios mantiene por separado el documento y el seguimiento de la práctica.

ConsultaOfertas se implementa mediante la fachada pública de Ofertas, en el mismo backend; solo ese módulo accede a su repositorio privado. No se trata de SQL de Postulaciones a tablas ajenas. Las llamadas de los diagramas C3/C4 son internas, no servicios HTTP separados.

Los avisos son internos en PostgreSQL; SIGA depende de autorización. La documentación no acredita que la integración esté implementada. Se evalúan únicamente AC01 Rendimiento, AC02 Seguridad y AC03 Mantenibilidad, con carga de 20 y 25 usuarios donde corresponde.
