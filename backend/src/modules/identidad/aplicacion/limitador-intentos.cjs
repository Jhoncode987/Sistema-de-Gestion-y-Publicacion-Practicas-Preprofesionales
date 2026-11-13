// Limita los intentos fallidos de inicio de sesión por correo (en memoria).
function crearLimitadorIntentos({
  maximo = 5,
  ventanaMs = 15 * 60 * 1000,
  ahora = () => Date.now()
} = {}) {
  const fallos = new Map();

  function vigentes(clave) {
    const limite = ahora() - ventanaMs;
    const lista = (fallos.get(clave) ?? []).filter((t) => t > limite);

    if (lista.length === 0) {
      fallos.delete(clave);
    } else {
      fallos.set(clave, lista);
    }

    return lista;
  }

  return {
    bloqueado: (clave) => vigentes(clave).length >= maximo,
    registrarFallo: (clave) => {
      const lista = vigentes(clave);
      lista.push(ahora());
      fallos.set(clave, lista);
    },
    reiniciar: (clave) => fallos.delete(clave)
  };
}

module.exports = { crearLimitadorIntentos };
