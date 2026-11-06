# Arquitectura inicial del sistema

## Decisión

**Arquitectura monolítica modular con API REST y PostgreSQL como única base de datos.** El backend es una sola aplicación desplegable; todos sus módulos se construyen, ejecutan y actualizan juntos. Clean Architecture organiza las dependencias internas.

El portal React se ejecuta en el navegador. Para la entrega base, sus archivos compilados los sirve el mismo despliegue del backend, que también expone /api/v1. PostgreSQL es un proceso de datos separado; esto no convierte el backend en microservicios. El lenguaje y framework del backend están pendientes de elección y no se presenta una implementación ejecutable.

## Bumeran como referencia funcional

Se toma como referencia el flujo observable de portal de empleo: empresa, aviso, candidato y postulación. Las fuentes documentan publicación de avisos, administración de candidatos y seguimiento desde “Mis postulaciones”:

- [Publicación y administración de postulaciones](https://www.bumeran.com.pe/productos/talento/).
- [Seguimiento de postulaciones](https://www.bumeran.com.pe/blog/buscar-trabajo/que-hacer-despues-de-postular-a-un-empleo-en-bumeran/).
- [Condiciones de publicación y moderación](https://www.bumeran.com.pe/empresas/condicionesDeContratacion).

Referencia consultada: 6 de noviembre de 2026. Las páginas comerciales pueden cambiar. Estos enlaces sustentan capacidades observables, no la implementación técnica de Bumeran.

| Capacidad de referencia | Adaptación UNSCH | Módulo responsable |
|---|---|---|
| Cuenta de candidato | Identidad y perfil del estudiante | Usuarios y Autenticación |
| Cuenta de empresa | Credenciales en Usuarios; perfil institucional y validación en Empresas | Usuarios y Empresas |
| Publicación de avisos | Ofertas revisadas por el coordinador | Ofertas |
| Consulta de oportunidades | Filtros por carrera, ciclo y modalidad | Ofertas |
| Postulación y seguimiento | Verificación académica, registro sin duplicados y consulta de estados | Postulaciones |
| Administración de candidatos | Evaluación y selección por la empresa propietaria | Postulaciones |
| Extensión institucional propia | Convenios, seguimiento de prácticas, reportes y auditoría | Convenios y Prácticas; Reportes y Auditoría |

La aprobación por un coordinador UNSCH y la validación académica son reglas propias. No se afirma que Bumeran carezca de moderación, auditoría o reportes. Nuestra solución no gestiona pagos.

## Arquitectura base

~~~mermaid
flowchart TB
    U["Estudiante, empresa y personal autorizado"]
    Web["Portal React en navegador"]
    subgraph App["Único despliegue de aplicación"]
        Static["Archivos del portal"]
        API["Backend monolítico y API REST"]
        Modules["Módulos internos de negocio"]
        Static --- API
        API --> Modules
    end
    DB[("PostgreSQL")]
    U --> Web
    Web -->|"HTTPS: obtiene archivos"| Static
    Web -->|"HTTPS y JSON"| API
    Modules -->|"Consultas y transacciones"| DB
~~~

El detalle de contenedores, la relación con Bumeran y la vista de despliegue se encuentran en [Diagramas C4](diagramas-c4/diagramas-c4.md).

## Responsabilidades y propiedad

| Módulo | Responsabilidad y datos propios |
|---|---|
| Usuarios y Autenticación | Cuentas, credenciales, roles y asignaciones de ámbito. |
| Empresas | Perfil de empresa, estado de aprobación y motivo de decisión. |
| Ofertas | Requisitos, versiones, aprobación, vigencia y cierre. |
| Postulaciones | Candidaturas, evaluación, selección y protección de unicidad estudiante–oferta. |
| Convenios y Prácticas | Dos entidades con estados separados; seguimiento institucional del estudiante seleccionado. |
| Notificaciones | Avisos internos y lectura por destinatario, persistidos en PostgreSQL. |
| Verificación Académica | Antecedentes verificados del periodo vigente, con fuente y fecha; puerto para una eventual consulta autorizada a SIGA. |
| Reportes y Auditoría | Proyecciones mediante contratos públicos; registro de acciones sensibles. |

Cada módulo es dueño de sus tablas, preferentemente en un esquema propio de la misma base. No accede directamente a tablas o repositorios internos de otros módulos. La comunicación es mediante llamadas en memoria a contratos públicos, no HTTP entre módulos.

## Simplificación y cambios en el backend

- Una sola base PostgreSQL almacena negocio, antecedentes verificados, notificaciones y auditoría.
- Las notificaciones se registran dentro de transacciones del mismo backend; su lectura es desde el portal. No se requiere correo, SMS ni un worker independiente.
- Reportes y dashboard consultan contratos públicos y se generan en el backend.
- La búsqueda usa filtros, índices y paginación de 20 resultados; se mide con 20 y 25 usuarios simultáneos.
- Sin Redis, RabbitMQ, microservicios ni almacenamiento adicional en la versión base.
- SIGA no forma parte del despliegue base: se incorpora mediante adaptador solo con autorización. Mientras tanto, el coordinador verifica antecedentes del periodo vigente; sin verificación válida la postulación no se acepta.

## API REST propia basada en la referencia funcional

La API implementa los recursos de empresas, ofertas y postulaciones derivados de esos flujos. Sus rutas y contratos son diseño del proyecto UNSCH; no son endpoints publicados por Bumeran ni implican consumir sus servicios.

Ver [contratos REST y correspondencia funcional](api-rest.md).

## Alcance de la documentación

Los tres atributos son AC01 Rendimiento, AC02 Seguridad y AC03 Mantenibilidad. Los escenarios y diagramas son propuestas; todavía no acreditan código, integración externa o despliegue ejecutado.
