# Atributos de Calidad

| ID | Atributo de Calidad | Escenario de Calidad |
|---|---|---|
| **AC01** | Escalabilidad | El sistema utilizará una arquitectura de microservicios (Autenticación, Ofertas, Postulaciones, Convenios y Notificaciones) para soportar el crecimiento en el número de escuelas, empresas y estudiantes de forma independiente. La separación de servicios deberá justificarse por la necesidad de escalamiento y no solo por una división nominal. |
| **AC02** | Rendimiento | Se evaluará el uso de Redis para las ofertas consultadas con frecuencia y RabbitMQ para tareas que puedan procesarse de forma asíncrona, como notificaciones. Su incorporación se realizará cuando las mediciones o los escenarios de carga lo justifiquen, evitando complejidad innecesaria en una primera versión. |
| **AC03** | Seguridad | El sistema validará los roles y permisos para estudiantes, empresas, coordinadores y administradores. Se propone autenticación basada en tokens JWT, autorización en los servicios correspondientes y registro de auditoría para acciones administrativas. El API Gateway no será el único punto de control de autorización. |
| **AC04** | Usabilidad | La plataforma centralizará en una interfaz web única, propuesta con React, los procesos que antes se realizaban de forma dispersa, facilitando el acceso a ofertas, postulaciones y seguimiento de prácticas. |
| **AC05** | Mantenibilidad | El código se organizará en módulos con responsabilidades claras y dependencias controladas. Los cambios en presentación, persistencia o integraciones externas deberán poder realizarse sin modificar innecesariamente las reglas del negocio. Se favorecerán contratos explícitos, pruebas automatizadas y documentación de decisiones arquitectónicas. |

## Criterios de verificación

- **AC01:** un módulo puede evolucionar y desplegarse sin cambios innecesarios en los demás servicios, manteniendo contratos compatibles.
- **AC02:** se medirán los tiempos de respuesta y el comportamiento en periodos de alta demanda antes y después de incorporar caché o mensajería.
- **AC03:** las pruebas verificarán permisos por rol, protección de endpoints y trazabilidad de operaciones sensibles.
- **AC04:** estudiantes y empresas podrán completar los flujos principales mediante una interfaz consistente y comprensible.
- **AC05:** los casos de uso podrán probarse sin depender directamente de la base de datos, del framework web o de los proveedores externos.
