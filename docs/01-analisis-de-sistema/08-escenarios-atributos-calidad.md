# Escenarios de atributos de calidad

Este documento convierte los atributos generales en escenarios que puedan verificarse. Las medidas numéricas son **objetivos iniciales propuestos**, no resultados de pruebas; deben validarse con el equipo y con la infraestructura disponible.

Cada escenario identifica fuente, estímulo, artefacto, entorno, respuesta, medida y forma de verificación.

## EQ-01. Rendimiento: búsqueda de ofertas

| Elemento | Descripción |
|---|---|
| Atributo | Rendimiento |
| Fuente | Estudiante que consulta ofertas |
| Estímulo | Realiza una búsqueda o aplica filtros por carrera, ciclo o modalidad |
| Artefacto | API REST, módulo de Ofertas y consultas a PostgreSQL |
| Entorno | Datos representativos y prueba de carga documentada |
| Respuesta | Devuelve resultados pertinentes sin errores inesperados |
| Medida propuesta | Percentil 95 de respuesta ≤ 2 segundos y errores técnicos < 1 % con 100 usuarios simultáneos |
| Verificación | Ejecutar una prueba de carga, guardar configuración, resultados, latencias y errores |
| Estado | Pendiente de validación |

## EQ-02. Disponibilidad: consulta de ofertas

| Elemento | Descripción |
|---|---|
| Atributo | Disponibilidad |
| Fuente | Estudiante o empresa |
| Estímulo | Intenta consultar ofertas durante el horario de uso previsto |
| Artefacto | Frontend, API REST y base de datos |
| Entorno | Sistema desplegado y con monitoreo |
| Respuesta | Permite consultar ofertas o devuelve un error controlado si una dependencia no está disponible |
| Medida propuesta | Objetivo inicial de disponibilidad mensual de 99,5 %, sujeto a capacidad y presupuesto de despliegue |
| Verificación | Revisar monitoreo y calcular tiempo disponible e interrupciones |
| Estado | Pendiente de definir cómo se medirá y qué mantenimiento se excluye |

## EQ-03. Escalabilidad: aumento de solicitudes

| Elemento | Descripción |
|---|---|
| Atributo | Escalabilidad |
| Fuente | Aumento de usuarios concurrentes |
| Estímulo | Crece la cantidad de solicitudes de búsqueda y postulación |
| Artefacto | Backend modular y PostgreSQL |
| Entorno | Prueba reproducible con una configuración y conjunto de datos documentados |
| Respuesta | Soporta la carga objetivo sin superar los límites acordados |
| Medida propuesta | Probar incrementos de 25, 50 y 100 usuarios; buscar percentil 95 ≤ 3 segundos y errores < 1 % en la carga acordada |
| Verificación | Comparar latencia, errores y uso de recursos en cada nivel de carga |
| Estado | Pendiente de ejecutar; estos valores no son resultados obtenidos |

## EQ-04. Seguridad: autorización por rol

| Elemento | Descripción |
|---|---|
| Atributo | Seguridad |
| Fuente | Usuario no autenticado o con permisos insuficientes |
| Estímulo | Intenta consultar o modificar un recurso protegido |
| Artefacto | API REST y operaciones de negocio protegidas |
| Entorno | Pruebas con usuarios de distintos roles y solicitudes sin credenciales |
| Respuesta | Rechaza la operación no autorizada y no modifica ni expone información protegida |
| Medida | 100 % de los casos no autorizados definidos en el conjunto de pruebas deben ser rechazados |
| Verificación | Ejecutar pruebas por rol y revisar códigos HTTP, datos devueltos y cambios persistidos |
| Estado | Pendiente de definir la matriz de permisos y ejecutar las pruebas |

## EQ-05. Mantenibilidad: cambio localizado

| Elemento | Descripción |
|---|---|
| Atributo | Mantenibilidad |
| Fuente | Equipo de desarrollo |
| Estímulo | Cambia una regla de elegibilidad o una implementación de persistencia |
| Artefacto | Caso de uso de Postulaciones y sus dependencias |
| Entorno | Código organizado por módulos y con pruebas automatizadas |
| Respuesta | El cambio queda limitado al módulo o adaptador correspondiente, salvo dependencias justificadas |
| Medida propuesta | Las pruebas del módulo afectado pasan y las pruebas de regresión de los módulos relacionados no presentan fallos nuevos |
| Verificación | Ejecutar pruebas unitarias e integración antes y después del cambio; revisar archivos afectados |
| Estado | Pendiente de establecer y ejecutar la suite de pruebas |

## EQ-06. Integridad: evitar postulaciones duplicadas

| Elemento | Descripción |
|---|---|
| Atributo | Integridad de datos |
| Fuente | Estudiante que envía solicitudes repetidas o concurrentes |
| Estímulo | Intenta postular más de una vez a la misma oferta |
| Artefacto | Caso de uso Registrar Postulación y persistencia |
| Entorno | Solicitudes secuenciales y concurrentes para el mismo estudiante y oferta |
| Respuesta | Conserva una sola postulación válida por estudiante y oferta y comunica el resultado de forma controlada |
| Medida | Cero duplicados en el conjunto de pruebas, incluyendo solicitudes concurrentes |
| Verificación | Ejecutar pruebas de repetición y concurrencia; comprobar reglas de aplicación y restricciones de base de datos |
| Estado | Pendiente de implementación y pruebas |

## Notas de validación

- Los umbrales son propuestas iniciales que deben aprobarse y ajustarse al contexto del proyecto.
- No afirmar que un atributo está satisfecho hasta ejecutar y registrar las pruebas.
- La disponibilidad real dependerá de la infraestructura y el presupuesto que se definan posteriormente.
- Los resultados deben registrar fecha, entorno, configuración, carga aplicada, métricas y observaciones.