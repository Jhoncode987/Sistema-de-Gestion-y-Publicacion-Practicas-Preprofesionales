# Estado del sistema y trabajo futuro

## Implementado y desplegado

- Registro e inicio de sesión con tres roles (estudiante con cuenta institucional `@unsch.edu.pe`, empresa y coordinador), sesiones firmadas con JWT.
- Empresas: registro, publicación de ofertas, cierre de ofertas propias y vista de postulantes con aceptar, rechazar y finalizar práctica.
- Coordinación (RF01): validación de empresas y de ofertas, cierre de ofertas, resumen y listado de postulaciones.
- Estudiantes: ofertas con filtros y paginación, perfil académico, postulación con elegibilidad (carrera, ciclo y créditos), historial y retiro.
- Control de vacantes con candado por oferta y por estudiante: nunca se acepta a más personas que vacantes ni a un estudiante en dos prácticas; al llenarse las vacantes la oferta se cierra sola.
- Las ofertas nunca se eliminan (trazabilidad); solo se cierran.
- Pruebas automáticas (100, con Jest y cobertura del 75 %) que se ejecutan en GitHub Actions en cada push, y pruebas de carga y seguridad con k6 contra PostgreSQL real, incluida la concurrencia (informe en `docs/05-validacion`).
- API documentada con OpenAPI y Swagger UI en `/api-docs`.
- Despliegue en Vercel, Render y Neon con despliegue automático desde `main` ([despliegue.md](despliegue.md)).

## Limitaciones conocidas

| Limitación | Consecuencia | Mitigación actual |
|------------|--------------|-------------------|
| Los créditos los verifica la coordinación a mano, con el reporte de notas que sube el estudiante. | Depende de la revisión de una persona y el reporte es un PDF que no se valida automáticamente. | Solo cuentan los créditos verificados; si el estudiante cambia sus créditos declarados la verificación se pierde, y quedan registrados quién verificó y cuándo. Carrera y ciclo siguen siendo declarados. |
| El correo institucional se valida por su formato, no por su propiedad. | Alguien podría registrarse con un correo `@unsch.edu.pe` ajeno. | Los datos de la cuenta no dan acceso a información de terceros. |
| Una postulación retirada no se puede repetir. | El estudiante no puede volver a postular a la misma oferta. | Queda como historial. |
| Plan gratuito de Render. | Primera carga lenta tras inactividad. | Abrir el sistema unos minutos antes de usarlo. |

## Trabajo futuro

1. **Docentes como usuarios.** Hoy el docente asesor se registra como nombre. Convertirlo en una cuenta con rol propio permitiría que vea a sus asesorados y dé seguimiento a la práctica.
2. **Integración con SIGA (RC02, DA03).** Reemplazar la verificación manual y el perfil declarado por una consulta autorizada a la base académica mediante el adaptador previsto en el diseño. Depende de que la universidad otorgue acceso. Si SIGA no responde no debe asumirse que el estudiante es elegible.
3. **Verificación del correo institucional.** Enviar un enlace de confirmación antes de activar la cuenta. Requiere un servicio de correo; con un dominio propio verificado los mensajes llegan a cualquier destinatario, por lo que conviene hacerlo después de contar con el dominio.
4. **Notificaciones** a estudiantes y empresas ante cambios de estado de una postulación.
5. **Dominio propio** para la interfaz web, con Cloudflare (pasos en [despliegue.md](despliegue.md)). Antes conviene permitir más de un origen en `CORS_ORIGIN`, que hoy admite uno solo.
6. **Mejoras operativas:** respaldos programados de la base de datos y un plan de pago de Render para evitar la suspensión por inactividad.
