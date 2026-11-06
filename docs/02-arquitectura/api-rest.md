# API REST propia con referencia funcional Bumeran

## Referencia y alcance

Se toman como referencia los flujos observables de empresas, avisos, candidatos y postulaciones. Las capacidades están documentadas en [publicación y gestión de candidatos](https://www.bumeran.com.pe/productos/talento/) y [seguimiento de postulaciones](https://www.bumeran.com.pe/blog/buscar-trabajo/que-hacer-despues-de-postular-a-un-empleo-en-bumeran/), consultados durante la revisión funcional del proyecto.

Las rutas siguientes son **propuestas de nuestro sistema UNSCH**, no endpoints oficiales de Bumeran. No se consume su API privada ni se atribuye a Bumeran nuestro stack técnico.

La API es la entrada del mismo backend monolítico. Conserva los siete módulos originales y PostgreSQL como única base. Los módulos no se llaman por HTTP entre sí.

## Correspondencia y operaciones

| Flujo funcional | Ruta propuesta | Módulo y permiso |
|---|---|---|
| Cuenta de candidato/empresa | POST /api/v1/usuarios | Usuarios y Autenticación: registro de estudiante/representante, sin autoasignación de roles institucionales. |
| Inicio de sesión | POST /api/v1/sesiones | Usuarios y Autenticación: verificar credenciales. |
| Perfil empresarial | POST /api/v1/empresas | Ofertas: registrar perfil pendiente vinculado a cuenta. Es un recurso HTTP, no un módulo nuevo. |
| Validación institucional propia | PATCH /api/v1/empresas/{id}/validacion | Ofertas: coordinador aprueba o rechaza empresa. |
| Publicación de aviso | POST /api/v1/ofertas | Ofertas: empresa validada envía oportunidad a revisión. |
| Revisión institucional propia | PATCH /api/v1/ofertas/{id}/validacion | Ofertas: coordinador decide publicación por separado. |
| Edición y cierre de aviso | PATCH /api/v1/ofertas/{id} | Ofertas: solo empresa propietaria; cambios de requisitos publicados vuelven a revisión. |
| Búsqueda de oportunidades | GET /api/v1/ofertas?modalidad=remota&page=1&pageSize=20 | Ofertas: filtrar por carrera/ciclo de la identidad autenticada y vigencia. |
| Postulación a aviso | POST /api/v1/postulaciones | Postulaciones: estudiante autenticado; cuerpo con ofertaId, identidad derivada de credenciales. |
| Mis postulaciones | GET /api/v1/me/postulaciones | Postulaciones: solo candidaturas propias. |
| Administración de candidatos | GET /api/v1/ofertas/{id}/postulaciones | Postulaciones: empresa propietaria o coordinador autorizado. |
| Evaluación empresarial | PATCH /api/v1/postulaciones/{id}/estado | Postulaciones: revisión, selección o rechazo por empresa propietaria. |
| Convenio institucional propio | POST /api/v1/convenios | Convenios: coordinador autorizado; requiere selección confirmada. |
| Seguimiento institucional propio | PATCH /api/v1/convenios/{id}/estado | Convenios: transiciones del documento. |
| Seguimiento de práctica propio | PATCH /api/v1/convenios/{id}/practica/estado | Convenios: transiciones de práctica separadas del documento. |
| Avisos internos propios | GET /api/v1/me/notificaciones | Notificaciones: solo avisos del destinatario. |
| Lectura de aviso propio | PATCH /api/v1/me/notificaciones/{id} | Notificaciones: destinatario marca lectura. |
| Reportes propios | GET /api/v1/reportes?periodo=2026-II&carrera=sistemas&formato=pdf | Reportes y Auditoría: permiso de reportes; json para dashboard, pdf o xlsx para exportación. |

El contrato académico es interno: Postulaciones llama a Integración Académica y esta usa el adaptador SIGA si se autoriza. No es una API de Bumeran.

## Respuestas y validación del backend

- HTTPS y JSON; los reportes exportados usan su tipo de archivo. Listados con items, page, pageSize y total; pageSize máximo 20.
- 200 para consulta/actualización; 201 para creación; 400 para formato inválido; 401 sin credenciales válidas; 403 sin permiso, propiedad o ámbito; 404 para recurso inexistente.
- 409 para duplicidad, transición inválida u oferta cerrada/cambiada concurrentemente.
- 422 si los requisitos académicos no se cumplen; 503 si una verificación necesaria no está disponible. No confundir no elegible con falla técnica.
- Error JSON con codigo, mensaje y correlationId; no exponer SQL ni secretos.
- Antes del registro: consultar oferta, validar elegibilidad y revalidar vigencia/requisitos dentro de la transacción por contrato de Ofertas.
- RF05 se protege mediante restricción única estudiante–oferta. Una ráfaga de 25 solicitudes idénticas crea una sola fila.
- Notificaciones y auditoría obligatorias se coordinan mediante la unidad de trabajo del mismo backend.

## Estado

Diseño documental pendiente de framework, implementación, OpenAPI y pruebas. Un cambio de adaptador conserva estos contratos mientras no cambie el comportamiento del negocio (AC03).
