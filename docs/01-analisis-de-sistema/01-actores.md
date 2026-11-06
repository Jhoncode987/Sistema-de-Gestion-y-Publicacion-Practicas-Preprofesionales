# Actores del sistema

| Actor | Responsabilidad y límite de acceso |
|---|---|
| Estudiante | Consultar ofertas publicadas compatibles con su carrera y ciclo; postular en su nombre y consultar sus postulaciones, práctica y notificaciones. |
| Empresa | Registrar su perfil; enviar ofertas a revisión cuando esté validada; administrar sus propias ofertas y evaluar únicamente a quienes postulan a ellas. No aprueba su registro ni sus ofertas. |
| Coordinador de Prácticas | Aprobar o rechazar empresas y ofertas; verificar antecedentes académicos cuando no exista integración autorizada; supervisar convenios y prácticas dentro de su escuela asignada. |
| Administrador | Administrar cuentas, roles y asignaciones institucionales, y consultar auditoría. Este rol no sustituye automáticamente al coordinador en decisiones académicas. |
| Personal de la Oficina de Prácticas | Consultar dashboard y exportar reportes institucionales. Se implementa como permiso de lectura y exportación asignado a una cuenta identificada; una oficina no es una credencial compartida. |

La autorización se aplica en el backend por rol, propiedad del recurso y ámbito institucional. Ver RF08 y AC02.
