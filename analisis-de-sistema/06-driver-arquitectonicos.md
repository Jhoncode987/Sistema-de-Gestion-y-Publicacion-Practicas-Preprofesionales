# Drivers Arquitectónicos Principales

| ID | Driver Arquitectónico | Origen | Implicancia en la Arquitectura |
|---|---|---|---|
| **DA01** | **Centralización de Procesos Dispersos** | Usabilidad | Impulsa una arquitectura basada en un portal web único (React) y un API Gateway que canalice las solicitudes de estudiantes, empresas y coordinadores para unificar los trámites manuales dispersos. |
| **DA02** | **Picos de Demanda Estacionales** | Rendimiento | Define la necesidad de evaluar caché de lectura (Redis) y procesamiento asíncrono (RabbitMQ) para evitar degradación ante el acceso masivo de estudiantes al inicio del semestre. Estas tecnologías se incorporarán según la carga y las mediciones. |
| **DA03** | **Integración con Sistemas Legados** | RF04 / Interoperabilidad | Obliga a aislar la comunicación con el Core Académico institucional (SIGA) mediante un adaptador de integración, para consultar datos de elegibilidad del alumno sin acoplar las reglas del sistema a la API externa. |
| **DA04** | **Evolución Modular** | AC01 / Escalabilidad | Favorece la separación de responsabilidades por capacidades del negocio (Autenticación, Ofertas, Postulaciones, Convenios y Notificaciones), permitiendo evolucionar cada módulo de forma controlada. La separación en microservicios y su despliegue independiente se justificarán según necesidades operativas reales. |
| **DA05** | **Comunicación estandarizada entre cliente y backend** | Requisito de integración / API REST | Define el uso de una API REST con contratos HTTP claros entre el portal web y el backend, facilitando la interoperabilidad y evitando que la interfaz dependa de detalles internos de los servicios. |
| **DA06** | **Mantenibilidad y facilidad de evolución** | AC05 / Mantenibilidad | El sistema debe permitir corregir errores, probar reglas de negocio y añadir o modificar funcionalidades sin generar cambios innecesarios en otros módulos. Se responde con responsabilidades bien delimitadas, Clean Architecture dentro de cada servicio, contratos explícitos, pruebas automatizadas y documentación de decisiones (ADR). |

## Relación de DA06 con el diseño

DA06 se concreta mediante el enfoque de Clean Architecture: las reglas de negocio y los casos de uso no deben depender directamente de React, del framework del servicio, de PostgreSQL, Redis, RabbitMQ ni del proveedor de integración con SIGA. Las dependencias de infraestructura se conectarán mediante interfaces y adaptadores.

La mantenibilidad se verificará revisando la dirección de las dependencias, la posibilidad de probar casos de uso sin servicios externos y el impacto de un cambio localizado sobre los demás módulos.
