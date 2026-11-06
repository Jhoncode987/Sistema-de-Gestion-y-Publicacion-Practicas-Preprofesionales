# Sistema Web para la Gestión y Publicación de Prácticas Preprofesionales de la UNSCH

## Descripción
Propuesta de sistema web para la Universidad Nacional de San Cristóbal de Huamanga (UNSCH), elaborada como parte del curso de Arquitectura de Software. Busca centralizar la gestión de prácticas preprofesionales para estudiantes, empresas y coordinadores.

## Estilo arquitectónico

Arquitectura **monolítica modular**: un backend con API REST y Clean Architecture interna, con **PostgreSQL como única base de datos**. Los archivos compilados del portal React se sirven desde ese despliegue y se ejecutan en el navegador. Notificaciones internas, antecedentes académicos verificados, reportes y auditoría se resuelven con el backend y PostgreSQL.

Se priorizan **tres atributos**: AC01 Rendimiento, AC02 Seguridad y AC03 Mantenibilidad. La carga objetivo de evaluación es de **20 y 25 usuarios simultáneos**.

Bumeran es la referencia funcional de empresas, avisos y postulaciones. Los contenedores y rutas REST documentados son diseño propio UNSCH; no describen la arquitectura privada ni consumen una API de Bumeran.

## Documentación
La documentación del proyecto se organiza en `docs/` y los ejemplos tecnológicos en `tecnologia/`.

- [Actores](docs/01-analisis-de-sistema/01-actores.md)
- [Historias de usuario](docs/01-analisis-de-sistema/02-historias-del-usuario.md)
- [Requisitos funcionales](docs/01-analisis-de-sistema/03-requisitos-funcionales.md)
- [Atributos de calidad](docs/01-analisis-de-sistema/04-atributos-de-calidad.md)
- [Restricciones](docs/01-analisis-de-sistema/05-restricciones.md)
- [Drivers arquitectónicos](docs/01-analisis-de-sistema/06-driver-arquitectonicos.md)
- [Escenarios medibles de atributos de calidad](docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md)
- [Arquitectura inicial](docs/02-arquitectura/arquitectura-inicial.md)
- [API REST propia con referencia Bumeran](docs/02-arquitectura/api-rest.md)
- [Estilo arquitectónico](docs/02-arquitectura/estilo-arquitectonico.md)
- [Enfoque de Clean Architecture](docs/02-arquitectura/enfoque/enfoque-arquitectonico.md)
- [Decisiones arquitectónicas (ADR)](docs/02-arquitectura/decisiones-arquitectonicas.md)
- [Diagramas C4](docs/02-arquitectura/diagramas-c4/diagramas-c4.md)
- [Diseño interno](docs/03-diseno-de-software/diseno-interno/01-diseno-interno.md)
- [Ejemplos tecnológicos de Clean Architecture](tecnologia/clean-architecture/README.md)

## Estado

Propuesta documental corregida según la revisión docente. Incluye C1–C4, despliegue conceptual, contratos REST y escenarios medibles; no contiene todavía backend ejecutable ni evidencia de pruebas. El lenguaje/framework y la configuración real de despliegue están pendientes. SIGA solo se incorpora con autorización; la base usa antecedentes verificados por el coordinador y no acepta postulaciones sin verificación válida.
