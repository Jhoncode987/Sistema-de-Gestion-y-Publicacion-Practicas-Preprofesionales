# Diagramas C4 y despliegue conceptual

Estado: propuesta del sistema UNSCH, sin implementación o despliegue acreditados. Referencias: RF01–RF10, AC01 Rendimiento, AC02 Seguridad, AC03 Mantenibilidad y ADR-001 a ADR-006.

## C1 — Contexto

~~~mermaid
flowchart TB
    Est["Estudiante"] --> S["Sistema de prácticas UNSCH"]
    Emp["Empresa"] --> S
    Coord["Coordinador"] --> S
    Admin["Administrador"] --> S
    Oficina["Personal de Oficina de Prácticas"] --> S
    S -.->|"Solo con autorización futura"| SIGA["Sistema académico institucional"]
~~~

Estudiantes buscan y postulan; empresas gestionan ofertas y candidatos; coordinadores validan y supervisan; administradores gestionan acceso; Oficina consulta reportes. Las notificaciones son internas. SIGA es una extensión opcional, no una dependencia del despliegue base.

**Bumeran es una referencia de diseño**, no un sistema integrado ni un actor de ejecución; por eso no aparece como servicio conectado.

## C2 — Contenedores con referencia funcional Bumeran

### Correspondencia conceptual

La tabla traduce capacidades observables de un portal como Bumeran a responsabilidades de **nuestros contenedores**. No describe contenedores, tecnología ni base de datos reales de Bumeran.

| Referencia funcional | Contenedor UNSCH | Responsabilidad propia |
|---|---|---|
| Formularios de candidato/empresa, listado de avisos y seguimiento | Portal web React | Mostrar formularios, filtros, ofertas y estados. |
| Procesar publicación de avisos, candidaturas y decisiones de empresa | Backend monolítico / API REST | Resolver los flujos mediante casos de uso y permisos. Añadir reglas académicas UNSCH. |
| Conservar información necesaria para esos flujos | PostgreSQL | Persistencia elegida por el proyecto: cuentas, empresas, ofertas, postulaciones y extensiones institucionales. No se atribuye este motor a Bumeran. |

Las fuentes funcionales están en [Arquitectura inicial](../arquitectura-inicial.md). La persistencia es una necesidad de nuestra solución; no se infiere un producto de datos interno de Bumeran.

### Contenedores de nuestra solución

~~~mermaid
flowchart TB
    U["Usuarios autorizados"]
    subgraph Sistema["Sistema UNSCH inspirado funcionalmente en Bumeran"]
        Web["Portal React en navegador"]
        API["Backend monolítico y API REST propia"]
        DB[("Única base PostgreSQL")]
    end
    U --> Web
    Web -->|"HTTPS: archivos del portal y JSON"| API
    API -->|"SQL y transacciones"| DB
~~~

En C4, un contenedor es una aplicación o almacén ejecutable; no implica Docker. El portal corre en el navegador, aunque sus archivos se sirven desde el despliegue del backend. El backend es **un solo contenedor lógico de aplicación** y todos los módulos corren en su proceso.

No hay Redis, RabbitMQ, bases adicionales, correo externo ni microservicios en C2. Las notificaciones se guardan en PostgreSQL.

## C3 — Componentes de Postulaciones dentro del backend

~~~mermaid
flowchart TB
    HTTP["PostulacionesController"] --> UC["RegistrarPostulacion"]
    UC --> D["Entidad Postulacion"]
    UC --> OF["Contrato público ConsultaOfertas"]
    UC --> VA["Contrato público VerificadorAcademico"]
    UC --> PR["Puerto PostulacionRepository"]
    FO["Fachada del módulo Ofertas"] -.->|"Implementa"| OF
    FA["Fachada de Verificación Académica"] -.->|"Implementa"| VA
    RP["Adaptador Postulaciones PostgreSQL"] -.->|"Implementa"| PR
    FO --> RO["Repositorio privado de Ofertas"]
    FA --> RA["Repositorio privado de antecedentes"]
    RO --> DB[("PostgreSQL")]
    RA --> DB
    RP --> DB
~~~

Las fachadas son componentes del mismo backend y se invocan en memoria. Postulaciones no consulta las tablas de Ofertas o antecedentes directamente. Cada módulo mantiene sus repositorios.

RegistrarPostulacion coordina además una unidad de trabajo y el contrato público de Notificaciones; los cambios administrativos utilizan Auditoría. Se omiten del dibujo para centrar el C3 en consulta y persistencia, pero siguen dentro del backend y PostgreSQL.

## C4 — Código conceptual de RegistrarPostulacion

~~~mermaid
classDiagram
    class RegistrarPostulacion {
        +ejecutar(estudianteId, ofertaId)
    }
    class ConsultaOfertas {
        <<interface>>
        +obtenerParaPostular(ofertaId)
    }
    class FachadaOfertas {
        +obtenerParaPostular(ofertaId)
    }
    class VerificadorAcademico {
        <<interface>>
        +verificar(estudianteId, requisitos)
    }
    class FachadaAcademica {
        +verificar(estudianteId, requisitos)
    }
    class PostulacionRepository {
        <<interface>>
        +guardar(postulacion)
    }
    class PostulacionRepositoryPostgres {
        +guardar(postulacion)
    }
    class Postulacion {
        +estudianteId
        +ofertaId
        +versionRequisitos
        +estado
    }
    RegistrarPostulacion --> ConsultaOfertas
    RegistrarPostulacion --> VerificadorAcademico
    RegistrarPostulacion --> PostulacionRepository
    RegistrarPostulacion --> Postulacion
    FachadaOfertas ..|> ConsultaOfertas
    FachadaAcademica ..|> VerificadorAcademico
    PostulacionRepositoryPostgres ..|> PostulacionRepository
~~~

ConsultaOfertas devuelve un DTO de requisitos, vigencia y versión, no la entidad interna del módulo. La transacción obtiene un bloqueo de oferta a través de la fachada y revalida su estado antes de persistir. El verificador devuelve un resultado estructurado que distingue elegible, no elegible, verificación pendiente y fallo técnico.

## Vista complementaria de despliegue base

~~~mermaid
flowchart TB
    Browser["Navegador del usuario"]
    subgraph Host["Servidor académico o universitario"]
        App["Proceso backend: API y archivos del portal"]
        PG[("Proceso PostgreSQL")]
        App -->|"Conexión privada"| PG
    end
    Browser -->|"HTTPS"| App
~~~

Esta topología base coloca aplicación y datos en un servidor para reducir componentes; no ofrece aislamiento ante caída del host. No implica elección de proveedor ni configuración ya realizada.

| Elemento | Configuración pendiente para implementación |
|---|---|
| Backend | Lenguaje/framework, comando de construcción/arranque, versión y puerto interno. |
| Acceso público | Dominio y terminación HTTPS para el mismo origen del portal y API. |
| PostgreSQL | Versión, credenciales de mínimo privilegio, migraciones, volumen persistente y respaldo/restauración. |
| Configuración | Secretos fuera del código; cadena de conexión; periodo académico vigente. |
| Operación | Registros, comprobación de salud y recuperación ante fallos; sin promesa de disponibilidad no medida. |
| Validación | Escenarios con 20 y 25 usuarios y matriz de permisos; guardar entorno y resultados. |

No se agregan infraestructura de nube o herramientas de contenedorización como tecnologías seleccionadas.

## Trazabilidad y comprobación

| Elemento | Requisitos y decisiones |
|---|---|
| Portal y API | RF01–RF10; DA01, DA05; ADR-001, ADR-006 |
| PostgreSQL único | RC05; ADR-001, ADR-003 |
| Empresas separado de identidad | RF01, RF08; ADR-005 |
| Contratos públicos y adaptadores | AC03; DA04, DA06; ADR-002, ADR-005 |
| Verificación académica local | RF04, RC02; ADR-004 |
| Unicidad y transacciones | RF05; ADR-005 |
| Autorización y auditoría | RF08, RF09; AC02 |
| Carga de 20 y 25 usuarios | AC01; EQ-01, EQ-02 |

El [contrato REST](../api-rest.md) usa estos mismos módulos y límites.
