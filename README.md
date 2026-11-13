# Sistema Web para la Gestión y Publicación de Prácticas Preprofesionales de la UNSCH

## Descripción
Propuesta de sistema web para la Universidad Nacional de San Cristóbal de Huamanga (UNSCH), elaborada como parte del curso de Arquitectura de Software. Busca centralizar la gestión de prácticas preprofesionales para estudiantes, empresas y coordinadores.

## Estilo arquitectónico
Se propone un **monolito modular** con una API REST y **Clean Architecture** como enfoque interno. El backend será una única aplicación desplegable organizada en módulos de Usuarios y Autenticación, Ofertas, Postulaciones, Convenios, Notificaciones, Integración Académica y Reportes y Auditoría. PostgreSQL es la persistencia de la primera versión; PostgreSQL es la única base de datos; no se incluyen caché externa, brokers ni microservicios. Se conservan los siete módulos originales. Como referencia funcional se toma el portal de empleo Bumeran (ver [Arquitectura inicial](docs/02-arquitectura/arquitectura-inicial.md)).

## Documentación
La documentación del proyecto se organiza en `docs/` y los ejemplos tecnológicos en `tecnologia/`.

- [Actores](docs/01-analisis-de-sistema/01-actores.md)
- [Historias de usuario](docs/01-analisis-de-sistema/02-historias-del-usuario.md)
- [Requisitos funcionales](docs/01-analisis-de-sistema/03-requisitos-funcionales.md)
- [Atributos de calidad](docs/01-analisis-de-sistema/04-atributos-de-calidad.md)
- [Restricciones](docs/01-analisis-de-sistema/05-restricciones.md)
- [Drivers arquitectónicos](docs/01-analisis-de-sistema/06-driver-arquitectonicos.md)
- [Escenarios medibles de atributos de calidad](docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md)
- [Arquitectura inicial](docs/02-arquitectura/arquitectura-inicial.md)
- [API REST con referencia funcional Bumeran](docs/02-arquitectura/api-rest.md)
- [Estilo arquitectónico](docs/02-arquitectura/estilo-arquitectonico.md)
- [Enfoque de Clean Architecture](docs/02-arquitectura/enfoque/enfoque-arquitectonico.md)
- [Decisiones arquitectónicas (ADR)](docs/02-arquitectura/decisiones-arquitectonicas.md)
- [Diagramas C4](docs/02-arquitectura/diagramas-c4/diagramas-c4.md)
- [Diseño interno](docs/03-diseno-de-software/diseno-interno/01-diseno-interno.md)
- [Ejemplos tecnológicos de Clean Architecture](tecnologia/clean-architecture/README.md)

## Tecnología
- **Backend:** Node.js con Express 5 y el cliente `pg` (SQL explícito, sin ORM).
- **Frontend:** React 19 con Vite.
- **Base de datos:** PostgreSQL, con un esquema por módulo.

La decisión está registrada en el [ADR-006](docs/02-arquitectura/decisiones-arquitectonicas.md).

## Ejecución local
1. Crea una base de datos en PostgreSQL y carga el esquema y los datos de prueba:
   ```
   psql -d nombre_de_la_base -f backend/migrations/001_crear_empresas_y_ofertas.sql
   psql -d nombre_de_la_base -f backend/migrations/002_indices_ofertas.sql
   psql -d nombre_de_la_base -f backend/migrations/003_crear_usuarios.sql
   psql -d nombre_de_la_base -f backend/migrations/004_vincular_empresa_con_usuario.sql
   psql -d nombre_de_la_base -f backend/migrations/005_revision_del_coordinador.sql
   psql -d nombre_de_la_base -f backend/migrations/006_motivo_de_cierre.sql
   psql -d nombre_de_la_base -f backend/migrations/007_perfil_academico_estudiante.sql
   psql -d nombre_de_la_base -f backend/migrations/008_crear_postulaciones.sql
   psql -d nombre_de_la_base -f backend/database/001_datos_prueba.sql
   psql -d nombre_de_la_base -f backend/database/002_datos_prueba_ofertas.sql   # opcional: ~23 ofertas para probar filtros y paginación
   ```
2. Backend (puerto 3000):
   ```
   cd backend
   cp .env.example .env     # completa los datos de tu PostgreSQL y JWT_SECRET
   npm install
   npm start          # o npm run dev para reiniciar al guardar
   npm test           # pruebas automáticas (no necesitan la base de datos)
   ```
   Comprueba que responde en `http://localhost:3000/api/v1/salud`.

   `JWT_SECRET` es obligatorio (mínimo 32 caracteres); sin él el servidor no inicia. Genera uno con:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Estudiantes y empresas se registran desde el portal. El coordinador se crea por script (PowerShell):
   ```
   $env:COORDINADOR_CLAVE="una-clave-segura"
   node scripts/crear-coordinador.cjs coordinador@unsch.edu.pe "Nombre Apellido"
   ```
3. Frontend (puerto 5173):
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Abre `http://localhost:5173`. Vite redirige `/api` al backend.

## Estado
Los documentos describen una propuesta arquitectónica. Los diagramas de arquitectura inicial y estilo se conservan con los siete módulos explicados. Se priorizan tres atributos (rendimiento, seguridad y mantenibilidad) y pruebas con 20 y 25 usuarios simultáneos. Hay una primera implementación ejecutable: el listado de ofertas con filtros y paginación, el registro e inicio de sesión con roles y el panel de empresa para publicar ofertas y el panel del coordinador para validarlas (backend en Express y portal en React, sobre PostgreSQL). Las demás funciones, las pruebas automatizadas y los resultados de prueba siguen pendientes.
