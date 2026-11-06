# Atributos de Calidad

Se priorizan **tres atributos**, conforme a la revisión docente. La modularidad y Clean Architecture son decisiones que contribuyen a mantenibilidad, no atributos adicionales.

| ID | Atributo | Aplicación | Verificación |
|---|---|---|---|
| AC01 | Rendimiento | Búsquedas y postulaciones en backend monolítico y PostgreSQL; índices, filtros y paginación. | EQ-01 y EQ-02 con 20 y 25 usuarios simultáneos. |
| AC02 | Seguridad | Autenticación, autorización por rol, propiedad y ámbito; auditoría en servidor. | EQ-03: matriz de accesos con 25 cuentas. |
| AC03 | Mantenibilidad | Siete módulos originales con contratos públicos y Clean Architecture interna. | EQ-04: cambio localizado del adaptador PostgreSQL. |

RF05 es una regla funcional de integridad, no un cuarto atributo. Los umbrales son objetivos pendientes de implementación y pruebas. Ver [escenarios medibles](08-escenarios-atributos-calidad.md).
