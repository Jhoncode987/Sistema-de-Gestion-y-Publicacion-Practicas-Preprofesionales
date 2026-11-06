# Enfoque interno: Clean Architecture

## Propósito

Organizar las dependencias del backend monolítico para AC03 Mantenibilidad. El estilo global sigue siendo monolítico; Clean Architecture no crea servicios adicionales.

## Capas dentro de cada módulo

| Capa | Responsabilidad | Ejemplo |
|---|---|---|
| Dominio | Entidades, reglas y transiciones independientes de tecnología. | Postulacion y su estado. |
| Aplicación | Casos de uso, coordinación y contratos requeridos. | RegistrarPostulacion; ConsultaOfertas y VerificadorAcademico. |
| Presentación | Controladores, DTO, autenticación y traducción HTTP. | POST /api/v1/postulaciones. |
| Infraestructura | Implementar puertos mediante tecnología concreta. | PostulacionRepositoryPostgres y verificador de antecedentes en PostgreSQL. |

Dominio no importa otras capas. Aplicación depende de dominio e interfaces internas. Presentación e infraestructura dependen de aplicación; la composición ensambla implementaciones. El frontend React consume HTTP, sin acceder directamente a datos.

~~~mermaid
flowchart TB
    C["Controlador REST"] --> U["Caso de uso"]
    U --> D["Dominio"]
    U --> P["Puertos internos"]
    A["Adaptadores PostgreSQL"] -.->|"Implementan"| P
    A --> DB[("PostgreSQL")]
~~~

Las flechas sólidas entre capas indican dependencia de código. La flecha hacia PostgreSQL representa acceso técnico del adaptador.

## Contratos entre módulos

Postulaciones no implementa un repositorio SQL para leer las tablas de Ofertas. Define o consume un contrato público ConsultaOfertas, implementado por la fachada del módulo Ofertas; esa fachada utiliza su propio repositorio privado. La misma regla aplica a Empresas, Verificación Académica y Reportes.

La composición conecta esas fachadas en el mismo proceso. No se llama por HTTP a módulos internos. Una unidad de trabajo permite coordinar transacciones PostgreSQL sin compartir acceso directo a tablas.

## Cambio localizado en el backend

Cambiar una consulta SQL de antecedentes académicos modifica el adaptador de Verificación Académica y sus pruebas. Mientras se conserve el contrato, no cambia RegistrarPostulacion, el controlador ni la API pública. EQ-04 mide precisamente este cambio.

Una modificación real de reglas académicas puede afectar al dominio y requerirá sus propias pruebas; no se promete que todo cambio pueda resolverse exclusivamente en infraestructura.

## Criterios de revisión

1. Dominio y casos de uso no importan el framework, ORM ni detalles de SIGA.
2. Los controladores obtienen la identidad autenticada y no aceptan roles declarados por el cliente.
3. Los casos de uso pueden probarse con dobles de los contratos públicos y repositorios.
4. Solo cada módulo conoce sus tablas y repositorios internos.
5. La base de datos es únicamente PostgreSQL y las notificaciones son internas.
6. Unicidad, transacciones, errores y autorizaciones se verifican también mediante pruebas de integración.

Ver [Diseño interno](../../03-diseno-de-software/diseno-interno/01-diseno-interno.md). Esta organización sigue siendo una propuesta hasta disponer de código ejecutable.
