# Estado del sistema y trabajo futuro

## Implementado y desplegado

- Registro e inicio de sesión con tres roles (estudiante con cuenta institucional `@unsch.edu.pe`, empresa y coordinador), sesiones firmadas con JWT.
- Empresas: registro, publicación de ofertas, cierre de ofertas propias y vista de postulantes con aceptar, rechazar y finalizar práctica.
- Coordinación (RF01): validación de empresas y de ofertas, cierre de ofertas, resumen y listado de postulaciones.
- Estudiantes: ofertas con filtros y paginación, perfil académico, postulación con elegibilidad (carrera, ciclo y créditos), historial y retiro.
- Control de vacantes con candado por oferta y por estudiante: nunca se acepta a más personas que vacantes ni a un estudiante en dos prácticas; al llenarse las vacantes la oferta se cierra sola.
- Las ofertas nunca se eliminan (trazabilidad); solo se cierran.
- Pruebas automáticas (89) y verificación contra PostgreSQL real, incluidas pruebas de concurrencia.

## Limitaciones conocidas

| Limitación | Consecuencia | Mitigación actual |
|------------|--------------|-------------------|
| El perfil académico (carrera, ciclo, créditos) lo declara el estudiante. | No es verificable. | Se declara de forma explícita y el diseño ya separa la elegibilidad en un componente intercambiable. |
| El correo institucional se valida por su formato, no por su propiedad. | Alguien podría registrarse con un correo `@unsch.edu.pe` ajeno. | Los datos de la cuenta no dan acceso a información de terceros. |
| Una postulación retirada no se puede repetir. | El estudiante no puede volver a postular a la misma oferta. | Queda como historial. |
| Plan gratuito de Render. | Primera carga lenta tras inactividad. | Abrir el sistema unos minutos antes de usarlo. |

## Trabajo futuro

1. **Integración con SIGA (RC02, DA03).** Reemplazar el perfil declarado por una consulta autorizada a la base académica mediante el adaptador previsto en el diseño. Depende de que la universidad otorgue acceso. Si SIGA no responde no debe asumirse que el estudiante es elegible.
2. **Verificación del correo institucional.** Enviar un enlace de confirmación antes de activar la cuenta. Requiere un servicio de correo; con un dominio propio verificado los mensajes llegan a cualquier destinatario, por lo que conviene hacerlo después de contar con el dominio.
3. **Notificaciones** a estudiantes y empresas ante cambios de estado de una postulación.
4. **Dominio propio** para la interfaz web.
5. **Mejoras operativas:** respaldos programados de la base de datos y un plan de pago de Render para evitar la suspensión por inactividad.
