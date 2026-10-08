# Sistema Web para la Gestión y Publicación de Prácticas Preprofesionales Universidad Nacional de San Cristóbal de Huamanga (UNSCH)

## Nombre
Jhon Vidal Sosa Bellido

## Descripción
Es una propuesta de sistema web para la Universidad Nacional de San Cristóbal de Huamanga (UNSCH), elaborada como parte del curso de Arquitectura de Software. Su objetivo es centralizar y gestionar las prácticas preprofesionales de todas las escuelas profesionales, reemplazando el proceso actual disperso (hojas de cálculo, WhatsApp y trámites presenciales) por una plataforma única.

## Estilo arquitectónico
El proyecto adopta un **monolito modular** como estilo arquitectónico para la primera versión. El backend será una sola aplicación desplegable, organizada en módulos con responsabilidades claras: Usuarios y Autenticación, Ofertas, Postulaciones, Convenios, Notificaciones e Integración Académica.

Como enfoque interno se propone **Clean Architecture**, separando Dominio, Aplicación, Presentación e Infraestructura y dirigiendo las dependencias hacia las reglas del negocio. El portal web consumirá una API REST. PostgreSQL es la persistencia principal propuesta; Redis y RabbitMQ son opcionales y solo se incorporarán si existe una necesidad justificada.

La arquitectura está documentada en:
- [Estilo arquitectónico](arquitectura/estilo-arquitectonico.md)
- [Enfoque de Clean Architecture](arquitectura/enfoque/enfoque-arquitectonico.md)
- [Diagrama de arquitectura inicial](arquitectura/arquitectura-inicial.md)
- [Registro de decisiones arquitectónicas (ADR)](arquitectura/decisiones-arquitectonicas.md)

## Caso de estudio
UNSCH

## Curso
Arquitectura de Software
