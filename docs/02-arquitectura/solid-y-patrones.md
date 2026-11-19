# Principios SOLID y patrones de diseño en el código

Sprint 2, actividad 6. Cada punto señala dónde se aplica en el código y, si corresponde, qué no se aplicó. Complementa la sección 8 del [diseño interno](../03-diseno-de-software/diseno-interno/01-diseno-interno.md).

## Principios SOLID

| Principio | Cómo se aplica | Dónde |
|---|---|---|
| **S** Responsabilidad única | Cada caso de uso hace una sola cosa (`postular`, `retirar`, `aceptar`, `finalizar`, `asignarAsesor`…). Los repositorios solo ejecutan SQL; los manejadores solo traducen HTTP a casos de uso y errores a códigos. | `modules/*/aplicacion`, `infraestructura`, `presentacion` |
| **O** Abierto/cerrado | La elegibilidad es una función pura que devuelve una lista de motivos: agregar una regla es sumar una condición sin tocar el caso de uso. Los errores de negocio llevan un código estable, y la capa HTTP los traduce sin conocer cada caso. | `postulaciones/aplicacion/elegibilidad.cjs`, `errores-http.cjs` |
| **L** Sustitución de Liskov | Los casos de uso aceptan cualquier objeto que cumpla el contrato del repositorio. Las pruebas usan repositorios en memoria y los casos de uso se comportan igual que con PostgreSQL. | `postulaciones.test.cjs` (repositorio falso), `usuarios.repository.cjs` |
| **I** Segregación de interfaces | Postulaciones no recibe el repositorio completo de Ofertas, sino un contrato con las cuatro funciones que necesita. De Identidad solo recibe `obtenerPerfilUsuario` y `obtenerPerfiles`. Los permisos se separan en `soloEstudiante`, `soloEmpresa`, `soloCoordinador`. | `ofertas/aplicacion/contratos-postulaciones.cjs`, `obtener-perfil.cjs`, `autenticacion.middleware.cjs` |
| **D** Inversión de dependencias | Los casos de uso son fábricas que reciben sus dependencias por parámetro (`crearPostular({ postulacionesRepository, ofertas, … })`); no importan `pg` ni Express. `server.cjs` es la raíz de composición que las conecta. | `server.cjs`, todos los `crear*` |

## Patrones de diseño

| Patrón | Uso | Dónde |
|---|---|---|
| **Repository** | Aísla el acceso a PostgreSQL detrás de métodos con nombre del negocio. Cambiar una consulta no toca el dominio (escenario EQ-04). | `*.repository.cjs` |
| **Inyección de dependencias por fábrica** | Reemplaza una clase con constructor: cada fábrica devuelve la función del caso de uso con sus dependencias capturadas. | `crear*` en `aplicacion` |
| **Fachada / contrato entre módulos** | Un módulo ofrece a otro solo funciones puntuales, sin exponer sus tablas: no hay claves foráneas entre esquemas. | `contratos-postulaciones.cjs`, `obtener-perfil.cjs` |
| **Manejadores puros** | Los controladores son funciones `(req, res)` sin estado, que se prueban sin levantar Express. | `*.manejadores.cjs` |
| **Cadena de responsabilidad (middleware)** | Autenticación, comprobación de rol y manejador se encadenan en la ruta. El rol se vuelve a comprobar en el caso de uso (defensa en profundidad). | `server.cjs`, `*.routes.cjs` |
| **Transacción con bloqueo consultivo** | Serializa solo las decisiones sobre la misma oferta o el mismo estudiante para no sobrepasar vacantes ni aceptar dos veces. | `postulaciones.repository.cjs` (`aceptar`) |
| **Objeto de error de dominio** | Errores con nombre y código (`ReglaDeNegocioError`, `NoEncontradoError`…) que la capa de presentación convierte en 4xx. | `errores.cjs` de cada módulo |
| **Puerto y adaptador (previsto)** | El perfil académico se obtiene hoy de lo que declara y verifica la coordinación; el diseño deja la elegibilidad como componente intercambiable para un adaptador SIGA. No está implementado. | `elegibilidad.cjs` |

## Lo que no se aplicó y por qué

- **Sin clases ni jerarquías de herencia:** el estilo de fábricas y funciones puras es más simple en JavaScript y facilita las pruebas.
- **Sin contenedor de inyección:** con tres módulos, la composición manual en `server.cjs` es suficiente y explícita.
- **Sin patrón Observer ni mensajería:** las notificaciones no se implementaron (ADR-006 descarta mensajería en esta entrega).
