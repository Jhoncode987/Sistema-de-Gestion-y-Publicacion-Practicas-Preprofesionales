function responder(res, estado, codigo, mensaje) {
  return res.status(estado).json({ codigo, mensaje });
}

// Exige un token válido y deja { id, rol } en req.usuario.
function crearAutenticar(tokens) {
  return function autenticar(req, res, next) {
    const cabecera = req.get("Authorization") ?? "";
    const [esquema, token] = cabecera.split(" ");
    const datos = esquema === "Bearer" ? tokens.verificar(token) : null;

    if (!datos) {
      return responder(res, 401, "NO_AUTENTICADO", "Debes iniciar sesión");
    }

    req.usuario = datos;
    next();
  };
}

// Se usa después de autenticar: requerirRol("coordinador").
function requerirRol(...roles) {
  return function (req, res, next) {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return responder(res, 403, "ACCESO_DENEGADO", "No tienes permiso para esta acción");
    }

    next();
  };
}

module.exports = { crearAutenticar, requerirRol };
