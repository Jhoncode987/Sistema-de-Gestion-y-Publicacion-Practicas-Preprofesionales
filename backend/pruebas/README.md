# Pruebas de carga y de atributos de calidad

Scripts para los escenarios de `docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md`
(EQ-01 búsqueda, EQ-02 postulación) y una prueba de estrés de hasta 2 000 usuarios
virtuales. Se miden con [k6](https://k6.io). **Se ejecutan contra el backend y
PostgreSQL locales**, no contra el plan gratuito de Render (se duerme y comparte CPU,
así que no mediría la arquitectura).

## Preparación (una sola vez)

Desde la raíz del proyecto, en PowerShell (ajusta `-U` si tu usuario no es `postgres`):

```powershell
# 1. Base exclusiva para pruebas, con todas las migraciones
psql -U postgres -c "CREATE DATABASE practicas_carga"
Get-ChildItem backend\migrations\*.sql | Sort-Object Name | ForEach-Object { psql -U postgres -d practicas_carga -f $_.FullName }

# 2. Semilla: 100 empresas, 1 000 ofertas, 2 000 estudiantes, 5 000 postulaciones
psql -U postgres -d practicas_carga -f backend\pruebas\semilla-carga.sql

# 3. Ids de los estudiantes y sus tokens de sesión (válidos 8 horas)
psql -U postgres -d practicas_carga -At -c "SELECT id FROM identidad.usuarios WHERE rol='estudiante' ORDER BY id" | Out-File -Encoding ascii backend\pruebas\k6\datos\ids-estudiantes.txt
cd backend
node pruebas\generar-tokens.cjs
```

## Arrancar el backend contra la base de carga

En otra ventana de PowerShell, dentro de `backend`:

```powershell
$env:DATABASE_URL = "postgresql://postgres:TU_CLAVE@localhost:5432/practicas_carga"
npm start
```

(El `JWT_SECRET` sale de `backend\.env`, el mismo con el que se generaron los tokens.)

## Ejecutar (desde `backend`)

Cada prueba dura unos 13 minutos (1 de subida + 2 de calentamiento + 10 de medición).
Para comprobar que todo funciona, antes de la medición real, añade `-e DURACION=30s`.

```powershell
# EQ-01 búsqueda: 20 y 25 usuarios simultáneos
k6 run -e USUARIOS=20 --summary-export=pruebas\k6\resultados\eq01-20.json pruebas\k6\eq01-busqueda.js
k6 run -e USUARIOS=25 --summary-export=pruebas\k6\resultados\eq01-25.json pruebas\k6\eq01-busqueda.js

# EQ-02 postulación: reiniciar datos antes de cada ejecución
psql -U postgres -d practicas_carga -f pruebas\reiniciar-postulaciones.sql
k6 run -e USUARIOS=20 --summary-export=pruebas\k6\resultados\eq02-20.json pruebas\k6\eq02-postulacion.js
psql -U postgres -d practicas_carga -f pruebas\reiniciar-postulaciones.sql
k6 run -e USUARIOS=25 --summary-export=pruebas\k6\resultados\eq02-25.json pruebas\k6\eq02-postulacion.js

# EQ-02 ráfaga: 25 solicitudes simultáneas de la misma cuenta a la misma oferta
psql -U postgres -d practicas_carga -f pruebas\reiniciar-postulaciones.sql
k6 run --summary-export=pruebas\k6\resultados\eq02-rafaga.json pruebas\k6\eq02-rafaga.js
psql -U postgres -d practicas_carga -At -c "SELECT count(*) FROM postulaciones.postulaciones WHERE oferta_id = 1 AND estudiante_id = 2100"   # debe ser 1

# Estrés: rampa progresiva hasta 2 000 usuarios virtuales
k6 run --summary-export=pruebas\k6\resultados\estres-2000.json pruebas\k6\estres-2000.js
```

Registra en el informe: fecha, commit, procesador y RAM del equipo, versión de k6,
Node y PostgreSQL. Los resultados se guardan en `pruebas/k6/resultados/`.

## Qué mide cada una

| Script | Objetivo (Sprint 1) |
|---|---|
| `eq01-busqueda.js` | p95 ≤ 2 s, fallos < 1 %, cero ofertas no publicadas o de otra carrera |
| `eq02-postulacion.js` | p95 ≤ 3 s, fallos < 1 % con solicitudes válidas |
| `eq02-rafaga.js` | exactamente 1 respuesta 201, 24 respuestas 409, 0 errores 5xx, 1 fila |
| `estres-2000.js` | no tiene umbral de aceptación: muestra dónde se degrada |
