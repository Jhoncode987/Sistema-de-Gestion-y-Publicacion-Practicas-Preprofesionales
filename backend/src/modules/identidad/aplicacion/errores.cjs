class DatosInvalidosError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "DatosInvalidosError";
  }
}

class CuentaDuplicadaError extends Error {
  constructor() {
    super("Ya existe una cuenta con ese correo, código de estudiante o RUC");
    this.name = "CuentaDuplicadaError";
  }
}

class CredencialesInvalidasError extends Error {
  constructor() {
    super("Correo o contraseña incorrectos");
    this.name = "CredencialesInvalidasError";
  }
}

class DemasiadosIntentosError extends Error {
  constructor() {
    super("Demasiados intentos fallidos. Intenta de nuevo más tarde");
    this.name = "DemasiadosIntentosError";
  }
}

class AccesoDenegadoError extends Error {
  constructor(mensaje = "No tienes permiso para esta acción") {
    super(mensaje);
    this.name = "AccesoDenegadoError";
  }
}

module.exports = {
  AccesoDenegadoError,
  DatosInvalidosError,
  CuentaDuplicadaError,
  CredencialesInvalidasError,
  DemasiadosIntentosError
};
