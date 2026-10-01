# Drivers Arquitectónicos

| Driver Arquitectónico | Descripción |
|---|---|
| **Centralización de Procesos Dispersos** | La necesidad de unificar un proceso fragmentado (hojas de cálculo, WhatsApp, trámites presenciales) impulsa una arquitectura basada en un portal web único (React) y un API Gateway que canalice todas las solicitudes de estudiantes, empresas y coordinadores. |
| **Picos de Demanda Estacionales** | El acceso masivo de estudiantes al inicio de cada semestre define la necesidad de utilizar herramientas de alto rendimiento como Redis (caché de lectura) y procesamiento asíncrono (RabbitMQ) para evitar la caída del sistema. |
| **Integración con Sistemas Legados** | La validación de los requisitos de los estudiantes (créditos y ciclos) obliga a diseñar microservicios capaces de comunicarse o simular integraciones directas con el Core Académico institucional (SIGA). |
| **Evolución Modular** | El objetivo de incluir nuevas funcionalidades a futuro sin afectar las operaciones actuales determina el diseño basado en microservicios independientes, orquestados en contenedores (Docker/Kubernetes). |