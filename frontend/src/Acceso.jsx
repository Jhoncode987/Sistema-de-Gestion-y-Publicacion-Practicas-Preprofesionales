import { useState } from "react";

const CORREO_INSTITUCIONAL = /@([a-z0-9-]+\.)*unsch\.edu\.pe$/i;

function irAInicio() {
  window.location.hash = "#/";
  window.scrollTo({ top: 0 });
}

// Estructura común de las páginas de acceso.
function PaginaAcceso({ titulo, subtitulo, children, pie }) {
  return (
    <main className="acceso-pagina">
      <div className="acceso__tarjeta">
        <a className="acceso__volver" href="#/">← Volver al portal</a>
        <h1>{titulo}</h1>
        {subtitulo && <p className="acceso__subtitulo">{subtitulo}</p>}
        {children}
        {pie && <div className="acceso__pie">{pie}</div>}
      </div>
    </main>
  );
}

function Campo({ etiqueta, ayuda, ...atributos }) {
  return (
    <label className="campo">
      {etiqueta}
      <input {...atributos} />
      {ayuda && <small>{ayuda}</small>}
    </label>
  );
}

// Envía el formulario, muestra el error y vuelve al inicio si todo sale bien.
function useEnvio(accion) {
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    setEnviando(true);

    try {
      await accion();
      irAInicio();
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return { error, enviando, enviar };
}

function Errores({ error }) {
  return error ? <p className="aviso error" role="alert">{error}</p> : null;
}

export function PaginaIngresar({ sesion }) {
  const [datos, setDatos] = useState({ correo: "", clave: "" });
  const { error, enviando, enviar } = useEnvio(() =>
    sesion.iniciarSesion(datos.correo, datos.clave)
  );
  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  return (
    <PaginaAcceso
      titulo="Ingresar al portal"
      subtitulo="Accede con tu cuenta institucional o de empresa."
      pie={
        <>
          <p>¿Aún no tienes cuenta?</p>
          <div className="acceso__opciones">
            <a className="boton-enlace" href="#/registro/institucional">
              <strong>Cuenta institucional</strong>
              <span>Para estudiantes de la UNSCH</span>
            </a>
            <a className="boton-enlace" href="#/registro/empresa">
              <strong>Cuenta de empresa</strong>
              <span>Para empresas que publican ofertas</span>
            </a>
          </div>
        </>
      }
    >
      <form className="acceso__formulario" onSubmit={enviar}>
        <Campo
          etiqueta="Correo electrónico"
          type="email"
          name="correo"
          value={datos.correo}
          onChange={cambiar}
          required
          maxLength={254}
          autoComplete="email"
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          name="clave"
          value={datos.clave}
          onChange={cambiar}
          required
          maxLength={128}
          autoComplete="current-password"
        />
        <Errores error={error} />
        <button type="submit" disabled={enviando}>
          {enviando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </PaginaAcceso>
  );
}

export function PaginaRegistroInstitucional({ sesion }) {
  const [datos, setDatos] = useState({
    nombre: "",
    codigoEstudiante: "",
    correo: "",
    clave: ""
  });
  const [errorLocal, setErrorLocal] = useState("");
  const { error, enviando, enviar } = useEnvio(async () => {
    if (!CORREO_INSTITUCIONAL.test(datos.correo.trim())) {
      throw new Error("Usa tu correo institucional (@unsch.edu.pe).");
    }

    await sesion.registrar({ rol: "estudiante", ...datos });
  });
  const cambiar = (e) => {
    setErrorLocal("");
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  return (
    <PaginaAcceso
      titulo="Cuenta institucional"
      subtitulo="Para estudiantes de la Universidad Nacional de San Cristóbal de Huamanga."
      pie={
        <p>
          ¿Ya tienes cuenta? <a href="#/ingresar">Ingresar</a> ·{" "}
          ¿Eres una empresa? <a href="#/registro/empresa">Crear cuenta de empresa</a>
        </p>
      }
    >
      <form className="acceso__formulario" onSubmit={enviar}>
        <Campo
          etiqueta="Nombre completo"
          name="nombre"
          value={datos.nombre}
          onChange={cambiar}
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
        />
        <Campo
          etiqueta="Código de estudiante"
          name="codigoEstudiante"
          value={datos.codigoEstudiante}
          onChange={cambiar}
          required
          inputMode="numeric"
          pattern="\d{6,10}"
          title="Entre 6 y 10 dígitos"
        />
        <Campo
          etiqueta="Correo institucional"
          type="email"
          name="correo"
          value={datos.correo}
          onChange={cambiar}
          required
          maxLength={254}
          placeholder="usuario@unsch.edu.pe"
          autoComplete="email"
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          name="clave"
          value={datos.clave}
          onChange={cambiar}
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          ayuda="Mínimo 8 caracteres."
        />
        <Errores error={error || errorLocal} />
        <button type="submit" disabled={enviando}>
          {enviando ? "Creando cuenta…" : "Crear cuenta institucional"}
        </button>
      </form>
    </PaginaAcceso>
  );
}

export function PaginaRegistroEmpresa({ sesion }) {
  const [datos, setDatos] = useState({
    razonSocial: "",
    ruc: "",
    nombre: "",
    correo: "",
    clave: ""
  });
  const { error, enviando, enviar } = useEnvio(() =>
    sesion.registrar({ rol: "empresa", ...datos })
  );
  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  return (
    <PaginaAcceso
      titulo="Cuenta de empresa"
      subtitulo="Para empresas que desean publicar ofertas de prácticas."
      pie={
        <p>
          ¿Ya tienes cuenta? <a href="#/ingresar">Ingresar</a> ·{" "}
          ¿Eres estudiante? <a href="#/registro/institucional">Crear cuenta institucional</a>
        </p>
      }
    >
      <form className="acceso__formulario" onSubmit={enviar}>
        <Campo
          etiqueta="Razón social"
          name="razonSocial"
          value={datos.razonSocial}
          onChange={cambiar}
          required
          minLength={2}
          maxLength={150}
          autoComplete="organization"
        />
        <Campo
          etiqueta="RUC"
          name="ruc"
          value={datos.ruc}
          onChange={cambiar}
          required
          inputMode="numeric"
          pattern="\d{11}"
          title="11 dígitos"
        />
        <Campo
          etiqueta="Nombre del contacto"
          name="nombre"
          value={datos.nombre}
          onChange={cambiar}
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
        />
        <Campo
          etiqueta="Correo de contacto"
          type="email"
          name="correo"
          value={datos.correo}
          onChange={cambiar}
          required
          maxLength={254}
          autoComplete="email"
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          name="clave"
          value={datos.clave}
          onChange={cambiar}
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          ayuda="Mínimo 8 caracteres."
        />
        <Errores error={error} />
        <p className="filtros__ayuda">
          La coordinación validará tu empresa antes de que puedas publicar
          ofertas.
        </p>
        <button type="submit" disabled={enviando}>
          {enviando ? "Creando cuenta…" : "Crear cuenta de empresa"}
        </button>
      </form>
    </PaginaAcceso>
  );
}
