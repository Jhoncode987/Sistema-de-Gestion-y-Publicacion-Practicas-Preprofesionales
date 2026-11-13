const { DatosInvalidosError } = require("./errores.cjs");
const { hashearClave } = require("./claves.cjs");

const ROLES_PUBLICOS = ["estudiante", "empresa"];
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Cuenta institucional: correos @unsch.edu.pe (o de un subdominio de unsch.edu.pe).
const CORREO_INSTITUCIONAL = /@([a-z0-9-]+\.)*unsch\.edu\.pe$/;

function texto(valor, campo, { min = 1, max }) {
  if (typeof valor !== "string") {
    throw new DatosInvalidosError(`${campo} es obligatorio`);
  }

  const limpio = valor.trim().replace(/\s+/g, " ");

  if (limpio.length < min || limpio.length > max) {
    throw new DatosInvalidosError(
      `${campo} debe tener entre ${min} y ${max} caracteres`
    );
  }

  return limpio;
}

function validarBase(datos) {
  const correo = texto(datos.correo, "El correo", { max: 254 }).toLowerCase();

  if (!CORREO.test(correo)) {
    throw new DatosInvalidosError("El correo no es válido");
  }

  const clave = datos.clave;

  if (typeof clave !== "string" || clave.length < 8 || clave.length > 128) {
    throw new DatosInvalidosError(
      "La contraseña debe tener entre 8 y 128 caracteres"
    );
  }

  return { correo, clave, nombre: texto(datos.nombre, "El nombre", { min: 2, max: 120 }) };
}

// Normaliza y valida el registro; devuelve los datos listos para guardar.
function validarRegistro(entrada) {
  if (entrada === null || typeof entrada !== "object") {
    throw new DatosInvalidosError("Solicitud inválida");
  }

  if (!ROLES_PUBLICOS.includes(entrada.rol)) {
    throw new DatosInvalidosError("El rol debe ser estudiante o empresa");
  }

  const base = validarBase(entrada);

  if (entrada.rol === "estudiante") {
    if (!CORREO_INSTITUCIONAL.test(base.correo)) {
      throw new DatosInvalidosError(
        "Los estudiantes deben usar su correo institucional (@unsch.edu.pe)"
      );
    }

    const codigo = texto(entrada.codigoEstudiante, "El código de estudiante", { max: 10 });

    if (!/^\d{6,10}$/.test(codigo)) {
      throw new DatosInvalidosError(
        "El código de estudiante debe tener entre 6 y 10 dígitos"
      );
    }

    return { ...base, rol: "estudiante", codigoEstudiante: codigo };
  }

  const ruc = texto(entrada.ruc, "El RUC", { max: 11 });

  if (!/^\d{11}$/.test(ruc)) {
    throw new DatosInvalidosError("El RUC debe tener 11 dígitos");
  }

  return {
    ...base,
    rol: "empresa",
    ruc,
    razonSocial: texto(entrada.razonSocial, "La razón social", { min: 2, max: 150 })
  };
}

function crearRegistrarUsuario({ usuariosRepository, tokens }) {
  return async function registrarUsuario(entrada) {
    const { clave, ...datos } = validarRegistro(entrada);
    const usuario = await usuariosRepository.crear({
      ...datos,
      hashClave: await hashearClave(clave)
    });

    return { usuario, token: tokens.emitir(usuario) };
  };
}

// El coordinador no se registra desde la web: lo crea un administrador por script.
function crearCrearCoordinador({ usuariosRepository }) {
  return async function crearCoordinador(entrada) {
    const { clave, ...datos } = validarBase(entrada ?? {});

    return usuariosRepository.crear({
      ...datos,
      rol: "coordinador",
      hashClave: await hashearClave(clave)
    });
  };
}

module.exports = { crearRegistrarUsuario, crearCrearCoordinador, validarRegistro };
