class AccesoDenegadoError extends Error {
  constructor(mensaje = "No tienes permiso para esta acción") {
    super(mensaje);
    this.name = "AccesoDenegadoError";
  }
}

class NoEncontradoError extends Error {
  constructor(mensaje = "No existe") {
    super(mensaje);
    this.name = "NoEncontradoError";
  }
}

class DatosInvalidosError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "DatosInvalidosError";
  }
}

// Regla de negocio incumplida: lleva un código estable para el frontend.
class ReglaDeNegocioError extends Error {
  constructor(codigo, mensaje, detalle = []) {
    super(mensaje);
    this.name = "ReglaDeNegocioError";
    this.codigo = codigo;
    this.detalle = detalle;
  }
}

module.exports = { AccesoDenegadoError, NoEncontradoError, DatosInvalidosError, ReglaDeNegocioError };
