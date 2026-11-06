# Estilo arquitectónico

## Selección y justificación

Se selecciona **arquitectura monolítica modular con API REST y PostgreSQL**. Una sola aplicación backend ejecuta todos los módulos en el mismo proceso y se actualiza como una unidad. El monolito modular es una forma de arquitectura monolítica con límites internos explícitos.

La carga académica de 20 a 25 usuarios simultáneos, el presupuesto y el equipo del proyecto justifican comenzar con un solo backend y una sola base de datos. La capacidad real se comprobará mediante los escenarios, no se deduce únicamente del estilo elegido.

Clean Architecture organiza el código por dominio, aplicación, presentación e infraestructura dentro de cada módulo. REST organiza el contrato HTTP con el portal. Ninguno de esos conceptos exige servicios independientes.

## Límites y comunicación

| Elemento | Decisión |
|---|---|
| Portal | React en el navegador, con archivos compilados servidos por el backend. |
| Backend | Monolito: Usuarios, Empresas, Ofertas, Postulaciones, Convenios y Prácticas, Notificaciones, Verificación Académica, Reportes y Auditoría. |
| Datos | Una instancia de PostgreSQL y una base para la aplicación; tablas/esquemas con propietario modular. |
| Comunicación externa del cliente | HTTPS y JSON mediante la API propia /api/v1. |
| Comunicación entre módulos | Contratos públicos invocados en memoria. Sin solicitudes HTTP internas ni acceso a tablas ajenas. |
| Notificaciones | Internas, almacenadas en PostgreSQL; sin proveedor externo en la base. |
| Sistema académico | Registros locales verificados; SIGA es una opción de adaptación autorizada, no una dependencia obligatoria del arranque. |

## Referencia funcional y diseño

Los flujos de Bumeran inspiran cuentas de candidatos/empresas, avisos y postulaciones. La descomposición en frontend, backend y datos es una **propuesta conceptual de nuestro sistema** que permite realizar esos flujos. No se presenta como arquitectura real de Bumeran.

El [C2](diagramas-c4/diagramas-c4.md) explicita esa correspondencia; [API REST](api-rest.md) concreta cómo el backend recibe y resuelve las operaciones.

## Costes y compensaciones

- Un cambio de código exige construir y publicar nuevamente el backend completo.
- Todos los módulos comparten proceso y base; una falla puede afectar al conjunto.
- Los contratos y la propiedad de tablas deben revisarse para evitar acoplamiento.
- Las transacciones locales facilitan mantener coherentes cambios, auditoría y notificaciones.
- Los índices y consultas se ajustan según las mediciones con 20 y 25 usuarios.

## Verificación

AC01 se verifica con EQ-01/EQ-02; AC02 con EQ-03; AC03 con EQ-04. La regla de duplicidad se prueba además con 25 solicitudes concurrentes del mismo estudiante a una oferta.

La vista conceptual de despliegue está en C4. Framework, proveedor, instalación, migraciones y pruebas ejecutables se completarán al implementar; no se afirma que el sistema ya esté desplegado.
