# Arquitectura Inicial del Sistema

## Estilo arquitectónico

El sistema se propone como un **monolito modular**: el backend se construye y despliega como una sola aplicación, pero su código se divide en módulos de negocio con responsabilidades e interfaces claras. La organización interna sigue el enfoque de Clean Architecture.

## Diagrama de arquitectura

El siguiente diagrama representa la arquitectura propuesta para el **Sistema Web para la Gestión y Publicación de Prácticas Preprofesionales (UNSCH)**.

```mermaid
flowchart TD
    subgraph Actores["ACTORES"]
        A1([Estudiante])
        A2([Empresa])
        A3([Coordinador / Administrador])
    end

    subgraph Presentacion["PRESENTACIÓN"]
        WEB["Portal web React"]
        API["API REST / Controladores"]
        WEB --> API
    end

    subgraph Backend["BACKEND: UNA APLICACIÓN DESPLEGABLE"]
        subgraph Modulos["MÓDULOS DE NEGOCIO"]
            M1["Usuarios y Autenticación"]
            M2["Ofertas"]
            M3["Postulaciones"]
            M4["Convenios"]
            M5["Notificaciones"]
            M6["Integración Académica"]
        end
        subgraph Capas["CAPAS INTERNAS: CLEAN ARCHITECTURE"]
            C1["Dominio"]
            C2["Aplicación / Casos de uso"]
            C3["Infraestructura"]
        end
    end

    DB[(PostgreSQL)]
    SIGA["Sistema académico SIGA"]
    MAIL["Proveedor de correo / SMS"]
    REDIS[("Redis opcional")]
    MQ[("RabbitMQ opcional")]

    A1 --> WEB
    A2 --> WEB
    A3 --> WEB
    API --> Modulos
    Modulos --> Capas
    C3 --> DB
    M6 -. integración autorizada .-> SIGA
    M5 -. envío de avisos .-> MAIL
    M2 -. caché opcional .-> REDIS
    M5 -. tareas asíncronas opcionales .-> MQ
```

## Responsabilidades principales

| Módulo | Responsabilidad |
|---|---|
| Usuarios y Autenticación | Identidad, acceso y permisos por rol. |
| Ofertas | Registro, publicación, edición, cierre y búsqueda de ofertas. |
| Postulaciones | Registro, validación, prevención de duplicados y seguimiento. |
| Convenios | Seguimiento de convenios de prácticas. |
| Notificaciones | Avisos sobre ofertas y cambios de estado. |
| Integración Académica | Consultar requisitos académicos a través de un adaptador, si se habilita el acceso a SIGA. |

## Consideraciones de diseño

- Los módulos forman parte de la misma aplicación y no son microservicios desplegados por separado.
- La base de datos PostgreSQL es la persistencia principal propuesta para la primera versión.
- Las reglas de negocio deben estar en el dominio y los casos de uso, no dentro de los controladores HTTP.
- Redis y RabbitMQ son opcionales; se incorporarán solo si los requisitos y las mediciones justifican su coste.
- La integración real con SIGA depende de los mecanismos de acceso que autorice la universidad.
- El diagrama es una propuesta conceptual. Debe actualizarse cuando se confirme la estructura real del código y la tecnología del backend.