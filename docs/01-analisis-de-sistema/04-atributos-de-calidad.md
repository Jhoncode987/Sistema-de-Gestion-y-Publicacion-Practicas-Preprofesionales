# Atributos de calidad

Se priorizan **exactamente tres atributos**, conforme al alcance académico. Los códigos se redefinen en esta revisión y todas las referencias de la documentación se alinean con esta tabla.

| ID | Atributo | Aplicación en la arquitectura | Verificación |
|---|---|---|---|
| AC01 | Rendimiento | Backend monolítico y PostgreSQL; consultas filtradas, índices, paginación y transacciones breves para la carga acordada de 20 y 25 usuarios simultáneos. | EQ-01 y EQ-02: medir p95, errores y duración de la prueba en ambos niveles de carga. |
| AC02 | Seguridad | Autenticación, autorización por rol/propiedad/ámbito en el backend y auditoría de operaciones sensibles. | EQ-03: solicitudes autorizadas y no autorizadas de 25 cuentas de prueba; comprobar respuestas y datos persistidos. |
| AC03 | Mantenibilidad | Módulos internos y Clean Architecture; contratos públicos entre módulos y adaptadores para PostgreSQL y verificación académica. | EQ-04: cambio localizado en un adaptador y ejecución de pruebas de regresión. |

La prevención de duplicados es una regla funcional de integridad de RF05, incluida en la verificación de postulación; no se cuenta como un cuarto atributo. La modularidad es una decisión de diseño que contribuye a AC03.

Los valores son objetivos propuestos, no resultados obtenidos. Ver [escenarios medibles](08-escenarios-atributos-calidad.md).
