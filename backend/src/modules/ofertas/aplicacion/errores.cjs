class OfertaInvalidaError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "OfertaInvalidaError";
  }
}

class AccesoDenegadoError extends Error {
  constructor(mensaje = "Solo las empresas pueden gestionar ofertas") {
    super(mensaje);
    this.name = "AccesoDenegadoError";
  }
}

class RucEnUsoError extends Error {
  constructor() {
    super("Ya existe una empresa registrada con ese RUC. Comunícate con la coordinación");
    this.name = "RucEnUsoError";
  }
}

class NoEncontradoError extends Error {
  constructor(mensaje = "No se encontró el registro") {
    super(mensaje);
    this.name = "NoEncontradoError";
  }
}

// La decisión ya no se puede tomar: otra persona la tomó antes o falta un requisito.
class TransicionInvalidaError extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = "TransicionInvalidaError";
    this.codigo = codigo;
  }
}

module.exports = {
  OfertaInvalidaError,
  AccesoDenegadoError,
  RucEnUsoError,
  NoEncontradoError,
  TransicionInvalidaError
};
