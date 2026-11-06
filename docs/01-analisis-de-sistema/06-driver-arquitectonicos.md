# Drivers arquitectónicos

| ID | Driver | Origen | Respuesta arquitectónica |
|---|---|---|---|
| DA01 | Centralizar oportunidades y seguimiento institucional | RF01–RF10 | Portal web con una API REST servida por un backend monolítico. |
| DA02 | Atender 20 a 25 usuarios simultáneos | AC01, EQ-01, EQ-02 | Medir con 20 y 25 usuarios; paginar, indexar y optimizar PostgreSQL. No se justifica infraestructura adicional para esta carga sin evidencia. |
| DA03 | Verificar antecedentes académicos sin depender de acceso externo no confirmado | RF04, RC02 | Puerto VerificadorAcademico; implementación base sobre registros verificados en PostgreSQL y adaptador SIGA únicamente si se autoriza. |
| DA04 | Separar capacidades dentro de un solo despliegue | RC05, AC03 | Módulos de Usuarios, Empresas, Ofertas, Postulaciones, Convenios y Prácticas, Notificaciones, Verificación Académica, Reportes y Auditoría, con contratos internos. |
| DA05 | API orientada a flujos funcionales de Bumeran | RC06, RF01–RF08 | Recursos propios de empresas, ofertas y postulaciones, con HTTP/JSON, autorización y errores explícitos. Es un diseño de nuestra API, no una reproducción de endpoints privados de Bumeran. |
| DA06 | Cambios localizados en el backend | AC03 | Dominio y casos de uso independientes del framework y PostgreSQL; puertos, adaptadores y pruebas. Cambiar un adaptador no obliga a cambiar contratos HTTP ni reglas del negocio. |
| DA07 | Proteger datos y decisiones institucionales | RF08, RF09, AC02 | Validar rol, propiedad y ámbito en servidor; auditar decisiones y proteger credenciales. |

## Trazabilidad

| Atributo | Drivers | Escenarios |
|---|---|---|
| AC01 Rendimiento | DA02 | EQ-01, EQ-02 |
| AC02 Seguridad | DA07 | EQ-03 |
| AC03 Mantenibilidad | DA03, DA04, DA06 | EQ-04 |

DA01 y DA05 responden también a requisitos funcionales y restricciones. No todos los drivers necesitan convertirse en un atributo de calidad adicional.
