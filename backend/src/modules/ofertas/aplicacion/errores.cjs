class OfertaInvalidaError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "OfertaInvalidaError";
  }
}

class AccesoDenegadoError extends Error {
  constructor() {
    super("Solo las empresas pueden gestionar ofertas");
    this.name = "AccesoDenegadoError";
  }
}

class RucEnUsoError extends Error {
  constructor() {
    super("Ya existe una empresa registrada con ese RUC. Comunícate con la coordinación");
    this.name = "RucEnUsoError";
  }
}

module.exports = { OfertaInvalidaError, AccesoDenegadoError, RucEnUsoError };
