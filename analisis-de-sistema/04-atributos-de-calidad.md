# Atributos de Calidad

| ID | Atributo de Calidad | Escenario de Calidad |
|---|---|---|
| **AC01** | Escalabilidad y modularidad | El backend se organizará como un monolito modular, con módulos de Usuarios y Autenticación, Ofertas, Postulaciones, Convenios, Notificaciones e Integración Académica. Los límites internos facilitarán el mantenimiento y permitirán escalar inicialmente la aplicación completa. La extracción futura de un módulo a un servicio independiente requerirá una justificación técnica específica. |
| **AC02** | Rendimiento | Se medirán los tiempos de respuesta y el comportamiento en periodos de alta demanda. Se evaluará Redis para las ofertas consultadas con frecuencia y RabbitMQ para tareas asíncronas, como notificaciones, solo cuando los escenarios de carga o los requisitos lo justifiquen. |
| **AC03** | Seguridad | El sistema validará roles y permisos para estudiantes, empresas, coordinadores y administradores. Se propone autenticación basada en tokens JWT, autorización en las operaciones protegidas y registro de auditoría para acciones administrativas. El control de permisos no dependerá únicamente de la interfaz web. |
| **AC04** | Usabilidad | La plataforma centralizará en una interfaz web única, propuesta con React, los procesos que antes se realizaban de forma dispersa, facilitando el acceso a ofertas, postulaciones y seguimiento de prácticas. |
| **AC05** | Mantenibilidad | El código se organizará en módulos con responsabilidades claras y dependencias controladas. Los cambios en presentación, persistencia o integraciones externas deberán poder realizarse sin modificar innecesariamente las reglas del negocio. Se favorecerán contratos explícitos, pruebas automatizadas y documentación de decisiones arquitectónicas. |

## Criterios de verificación

- **AC01:** los módulos tienen responsabilidades e interfaces internas identificables y evitan acceder directamente a detalles internos de otros módulos.
- **AC02:** se medirán tiempos de respuesta y comportamiento bajo carga antes y después de incorporar caché o mensajería.
- **AC03:** las pruebas verificarán permisos por rol, protección de endpoints y trazabilidad de operaciones sensibles.
- **AC04:** estudiantes y empresas podrán completar los flujos principales mediante una interfaz consistente y comprensible.
- **AC05:** los casos de uso podrán probarse sin depender directamente de la base de datos, del framework web o de proveedores externos.