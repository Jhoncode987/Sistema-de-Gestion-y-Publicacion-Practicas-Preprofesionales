# Drivers Arquitectónicos Principales

| ID | Driver Arquitectónico | Origen | Implicancia en la Arquitectura |
|---|---|---|---|
| **DA01** | **Centralización de Procesos Dispersos** | Usabilidad | Impulsa una arquitectura basada en un portal web único (React) y un API Gateway que canalice todas las solicitudes de estudiantes, empresas y coordinadores para unificar los trámites manuales dispersos. |
| **DA02** | **Picos de Demanda Estacionales** | Rendimiento | Define la necesidad de utilizar herramientas de alto rendimiento como Redis (caché de lectura) y procesamiento asíncrono (RabbitMQ) para evitar la caída del sistema ante el acceso masivo de estudiantes al inicio del semestre. |
| **DA03** | **Integración con Sistemas Legados** | RF-04 / Interoperabilidad | Obliga a diseñar microservicios capaces de comunicarse o simular integraciones directas con el Core Académico institucional (SIGA) para la validación automática de requisitos (créditos y ciclos). |
| **DA04** | **Evolución Modular** | Escalabilidad / Mantenibilidad | Determina el diseño basado en microservicios independientes, orquestados en contenedores (Docker/Kubernetes), permitiendo incluir nuevas funcionalidades a futuro sin afectar las operaciones actuales. |