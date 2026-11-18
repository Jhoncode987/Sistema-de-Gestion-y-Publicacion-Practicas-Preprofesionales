-- Repara una semilla cargada con la codificacion de la consola de Windows en vez de
-- UTF-8 (por ejemplo "Ingenieria" guardado con la "i" acentuada como 2 caracteres).
-- Es seguro repetirlo: solo toca filas que contienen el caracter 195 (A con tilde).
-- Solo para la base de pruebas de carga. Contiene solo ASCII a proposito.
\set ON_ERROR_STOP on
BEGIN;

UPDATE ofertas.ofertas
SET titulo      = convert_from(convert_to(titulo, 'LATIN1'), 'UTF8'),
    descripcion = convert_from(convert_to(descripcion, 'LATIN1'), 'UTF8'),
    carrera     = convert_from(convert_to(carrera, 'LATIN1'), 'UTF8')
WHERE titulo LIKE '%' || chr(195) || '%'
   OR descripcion LIKE '%' || chr(195) || '%'
   OR carrera LIKE '%' || chr(195) || '%';

UPDATE identidad.usuarios
SET nombre  = convert_from(convert_to(nombre, 'LATIN1'), 'UTF8'),
    carrera = convert_from(convert_to(carrera, 'LATIN1'), 'UTF8')
WHERE nombre LIKE '%' || chr(195) || '%'
   OR carrera LIKE '%' || chr(195) || '%';

COMMIT;

SELECT carrera, length(carrera) AS longitud, count(*) AS ofertas
FROM ofertas.ofertas GROUP BY carrera ORDER BY carrera;
