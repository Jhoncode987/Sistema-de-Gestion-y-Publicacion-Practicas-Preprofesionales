# Sistema Web para la Gestión y Publicación de Prácticas Preprofesionales de la UNSCH

## Descripción
Propuesta de sistema web para la Universidad Nacional de San Cristóbal de Huamanga (UNSCH), elaborada como parte del curso de Arquitectura de Software. Busca centralizar la gestión de prácticas preprofesionales para estudiantes, empresas y coordinadores.

## Estilo arquitectónico
Se propone un **monolito modular** con una API REST y **Clean Architecture** como enfoque interno. El backend será una única aplicación desplegable organizada en módulos de Usuarios y Autenticación, Ofertas, Postulaciones, Convenios, Notificaciones e Integración Académica. PostgreSQL es la persistencia principal propuesta; Redis y RabbitMQ son opcionales y solo se incorporarán si los requisitos y las mediciones lo justifican.

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
- [Estilo arquitectónico](docs/02-arquitectura/estilo-arquitectonico.md)
- [Enfoque de Clean Architecture](docs/02-arquitectura/enfoque/enfoque-arquitectonico.md)
- [Decisiones arquitectónicas (ADR)](docs/02-arquitectura/decisiones-arquitectonicas.md)
- [Diagramas C4](docs/02-arquitectura/diagramas-c4/README.md)
- [Diseño interno](docs/03-diseno-de-software/diseno-interno/README.md)
- [Ejemplos tecnológicos de Clean Architecture](tecnologia/clean-architecture/README.md)

## Estado
Los documentos describen una propuesta arquitectónica. Los diagramas C4, escenarios de calidad y ejemplos de código se completarán y validarán durante la Guía 4.
