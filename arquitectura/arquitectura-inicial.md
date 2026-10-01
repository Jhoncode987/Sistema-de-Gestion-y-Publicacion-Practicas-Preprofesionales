# Arquitectura Inicial del Sistema

## Diagrama de Arquitectura

El siguiente diagrama representa la arquitectura del **Sistema Web para la Gestión y Publicación de Prácticas Preprofesionales (UNSCH)**, estructurado en capas siguiendo el modelo de referencia analizado:

```mermaid
flowchart TD
    %% Estilos
    classDef capa fill:#1e1e1e,stroke:#333,stroke-width:2px,color:#fff;
    classDef nodo fill:#2d2d2d,stroke:#fff,stroke-width:1px,color:#fff;
    classDef ext fill:#2d2d2d,stroke:#fff,stroke-width:1px,color:#fff,stroke-dasharray: 5 5;

    %% Nodos principales
    subgraph Actores ["ACTORES"]
        direction LR
        A1([Estudiante]):::nodo
        A2([Empresa]):::nodo
        A3([Coordinador / Admin]):::nodo
    end

    subgraph Presentacion ["PRESENTACIÓN"]
        P1[Portal Web React / API Gateway]:::nodo
    end

    subgraph Negocio ["LÓGICA DE NEGOCIO (Microservicios)"]
        direction LR
        M1[Autenticación]:::nodo
        M2[Ofertas]:::nodo
        M3[Postulaciones]:::nodo
        M4[Convenios]:::nodo
        M5[Notificaciones]:::nodo
    end

    subgraph Datos ["DATOS"]
        direction LR
        D1[(PostgreSQL)]:::nodo
        D2[(Redis)]:::nodo
        D3[(RabbitMQ)]:::nodo
    end

    subgraph SistemasExternos ["SISTEMAS EXTERNOS"]
        direction LR
        E1[Core Académico - SIGA]:::ext
        E2[Servicio de Correo/SMS]:::ext
    end

    %% Relaciones
    Actores -->|Interactúan| Presentacion
    Presentacion -->|Enruta peticiones| Negocio
    Negocio -->|Lectura / Escritura| Datos
    Negocio -.->|Integraciones| SistemasExternos

    %% Aplicar estilos a subgrafos
    class Actores,Presentacion,Negocio,Datos,SistemasExternos capa;