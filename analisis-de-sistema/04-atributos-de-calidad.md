# Atributos de Calidad

| Atributo de Calidad | Descripción |
|---|---|
| **Escalabilidad** | El sistema utilizará una arquitectura de microservicios (Autenticación, Ofertas, Postulaciones, Convenios, Notificaciones) para soportar el crecimiento en el número de escuelas, empresas y estudiantes de forma independiente[cite: 26, 28, 29]. |
| **Rendimiento** | Se integrará una caché con Redis para las ofertas frecuentes y RabbitMQ para mensajería asíncrona, garantizando tiempos de respuesta rápidos incluso en periodos de alta demanda (como inicios de semestre)[cite: 28, 29]. |
| **Seguridad** | El sistema validará los roles en el API Gateway y emitirá tokens JWT para autorizar accesos, asegurando que los usuarios solo accedan a información permitida según su perfil, además de contar con un log de auditoría[cite: 25, 29]. |
| **Usabilidad** | La plataforma centralizará en una interfaz web única (construida en React) los procesos que antes se realizaban de forma dispersa, mejorando la experiencia del usuario final[cite: 24, 26, 28]. |