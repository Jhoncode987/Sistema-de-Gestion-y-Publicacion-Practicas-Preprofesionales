# Restricciones del sistema

| ID | Restricción | Consecuencia |
|---|---|---|
| RC01 | Sin pagos | No gestionar pagos, planes comerciales ni avisos destacados. |
| RC02 | Independencia del sistema académico | No reemplazar matrícula ni notas. SIGA solo se consulta mediante acceso institucional autorizado; la base funciona con antecedentes del periodo vigente verificados por el coordinador y registrados en PostgreSQL. Sin verificación válida no se acepta una postulación. |
| RC03 | Ámbito UNSCH | Gestionar oportunidades, postulaciones, convenios y seguimiento de prácticas de la universidad; quedan fuera la evaluación curricular y la certificación oficial. |
| RC04 | Presupuesto académico | Proponer ejecución en infraestructura universitaria o entorno académico de bajo costo. El presupuesto limita la solución; la ausencia de pagos no elimina las necesidades de seguridad, respaldo y restauración. No se promete disponibilidad de producción sin medición. |
| RC05 | Backend monolítico y PostgreSQL | Una sola aplicación backend y una sola base de datos PostgreSQL. Los módulos son internos. Sin microservicios, bases adicionales, caché externa ni broker de mensajes en la versión base. Notificaciones internas, auditoría y reportes se resuelven en el backend con PostgreSQL. |
| RC06 | Referencia funcional Bumeran | Inspirar capacidades y contratos de nuestra API en los flujos observables de candidatos, empresas, avisos y postulaciones. No consumir una API privada de Bumeran ni atribuirle nuestro stack, contenedores o arquitectura interna. |

La carga de evaluación se limita a 20 y 25 usuarios simultáneos. El proveedor de infraestructura y el framework del backend siguen pendientes; no existe todavía evidencia de despliegue ejecutable.
