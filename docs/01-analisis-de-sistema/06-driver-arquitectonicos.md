# Drivers Arquitectónicos Principales

| ID | Driver Arquitectónico | Origen | Implicancia en la Arquitectura |
|---|---|---|---|
| **DA01** | **Centralización de Procesos Dispersos** | RF03 / Centralización | Impulsa un portal web único y una API REST para unificar los trámites manuales dispersos de estudiantes, empresas y coordinadores en una plataforma consistente. |
| **DA02** | **Picos de Demanda Estacionales** | Rendimiento | Define pruebas de búsqueda y postulación con 20 y 25 usuarios simultáneos; optimizar consultas, índices y paginación en PostgreSQL sin añadir infraestructura. |
| **DA03** | **Integración con Sistemas Legados** | RF04 / Interoperabilidad | Obliga a aislar la comunicación con el Core Académico institucional (SIGA) mediante un adaptador, para consultar datos de elegibilidad del alumno sin acoplar las reglas del sistema a la API externa. La integración depende de que exista acceso autorizado. |
| **DA04** | **Evolución Modular** | AC03 / Mantenibilidad | Favorece la separación de responsabilidades por capacidades del negocio (Usuarios y Autenticación, Ofertas, Postulaciones, Convenios, Notificaciones, Integración Académica y Reportes y Auditoría) dentro de un único backend desplegable. La extracción futura de módulos a servicios independientes se evaluará solo ante una necesidad real. |
| **DA05** | **Comunicación estandarizada entre cliente y backend** | RC06 / Referencia funcional Bumeran | Define recursos REST propios para empresas, ofertas y postulaciones, inspirados en flujos funcionales de Bumeran; no se consume su API privada ni se presume su arquitectura interna. |
| **DA06** | **Mantenibilidad y facilidad de evolución** | AC03 / Mantenibilidad | El sistema debe permitir corregir errores, probar reglas de negocio y añadir o modificar funcionalidades sin generar cambios innecesarios en otros módulos. Se responde con responsabilidades bien delimitadas, Clean Architecture dentro de la aplicación, contratos explícitos, pruebas automatizadas y documentación de decisiones (ADR). |

## Relación de DA06 con el diseño

DA06 se concreta mediante el enfoque de Clean Architecture: las reglas de negocio y los casos de uso no deben depender directamente de React, del framework del backend, de PostgreSQL ni del proveedor de integración con SIGA. Las dependencias de infraestructura se conectarán mediante interfaces y adaptadores.

La mantenibilidad se verificará revisando la dirección de las dependencias, la posibilidad de probar casos de uso sin servicios externos y el impacto de un cambio localizado sobre los demás módulos.