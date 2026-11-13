import { useState } from "react";

const SITIO_UNSCH = "https://enlinea.unsch.edu.pe/";
const CORREO_INSTITUCIONAL = /@([a-z0-9-]+\.)*unsch\.edu\.pe$/i;

// Íconos sencillos (viewBox 24x24) para los mosaicos.
const ICONOS = {
  monitor: "M3 4h18v12H3V4zm2 2v8h14V6H5zM8 18h8v2H8v-2z",
  persona: "M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z",
  carpeta: "M3 5h6l2 2h10v12H3V5z",
  maletin: "M9 4h6v3h6v13H3V7h6V4zm2 2v1h2V6h-2z",
  birrete: "M12 3L1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2v4L12 21l7-3.8v-4L12 17l-7-3.8z",
  documento: "M6 2h9l5 5v15H6V2zm8 1.5V8h4.5L14 3.5zM8 12h10v2H8v-2zm0 4h10v2H8v-2z",
  lupa: "M10 3a7 7 0 015.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1110 3zm0 2a5 5 0 100 10 5 5 0 000-10z",
  ayuda: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a2 2 0 110 4 2 2 0 010-4zm-1 6h2v6h-2v-6z"
};

const SISTEMAS = [
  { nombre: "Aula Virtual", icono: "monitor" },
  { nombre: "Intranet", icono: "persona" },
  { nombre: "Matrícula", icono: "documento" },
  { nombre: "Bolsa de Trabajo", icono: "maletin" },
  { nombre: "Trámite Documentario", icono: "carpeta" },
  { nombre: "Grados y Títulos", icono: "birrete" },
  { nombre: "Búsqueda de Trámites", icono: "lupa" },
  { nombre: "Mesa de Ayuda OTI", icono: "ayuda" }
];

function Icono({ nombre }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fillRule="evenodd">
      <path d={ICONOS[nombre]} />
    </svg>
  );
}

function PanelSistemas() {
  return (
    <aside className="panel-sistemas">
      <div className="sistemas">
        {SISTEMAS.map(({ nombre, icono }) => (
          <a
            key={nombre}
            className="sistema"
            href={SITIO_UNSCH}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icono nombre={icono} />
            {nombre}
          </a>
        ))}

        <a
          className="sistema sistema--activo"
          href="#/"
          aria-current="page"
        >
          <Icono nombre="maletin" />
          Prácticas Preprofesionales
        </a>
      </div>

      <div className="panel-sistemas__bienvenida">
        <p>Bienvenido a</p>
        <strong>PRÁCTICAS PREPROFESIONALES</strong>
      </div>
    </aside>
  );
}

// Pantalla dividida: formulario a la izquierda y mosaicos a la derecha.
function PantallaAcceso({ titulo, children, pie }) {
  return (
    <div className="pantalla-acceso">
      <main className="acceso-panel">
        <img
          className="acceso-panel__logo"
          src="/logo-unsch.png"
          alt="Universidad Nacional de San Cristóbal de Huamanga"
        />
        <h1>Universidad Nacional de San Cristóbal de Huamanga</h1>
        <p className="acceso-panel__bienvenida">{titulo}</p>
        {children}
        {pie && <div className="acceso__pie">{pie}</div>}
      </main>

      <PanelSistemas />
    </div>
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

// Envía el formulario y muestra el error si falla; si sale bien, la sesión
// queda iniciada y la aplicación pasa sola al portal.
function useEnvio(accion) {
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    setEnviando(true);

    try {
      await accion();
      window.location.hash = "#/";
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return { error, enviando, enviar };
}

function AvisoError({ mensaje }) {
  return mensaje ? <p className="aviso error" role="alert">{mensaje}</p> : null;
}

export function PaginaIngresar({ sesion }) {
  const [datos, setDatos] = useState({ correo: "", clave: "" });
  const { error, enviando, enviar } = useEnvio(() =>
    sesion.iniciarSesion(datos.correo, datos.clave)
  );
  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  return (
    <PantallaAcceso
      titulo="Bienvenido"
      pie={
        <>
          <p>¿Aún no tienes cuenta?</p>
          <a className="boton-enlace" href="#/registro/institucional">
            Cuenta institucional <span>Estudiantes de la UNSCH</span>
          </a>
          <a className="boton-enlace" href="#/registro/empresa">
            Cuenta de empresa <span>Empresas que publican ofertas</span>
          </a>
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
          placeholder="Usuario"
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
          placeholder="Contraseña"
        />
        <AvisoError mensaje={error} />
        <button type="submit" disabled={enviando}>
          {enviando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </PantallaAcceso>
  );
}

export function PaginaRegistroInstitucional({ sesion }) {
  const [datos, setDatos] = useState({
    nombre: "",
    codigoEstudiante: "",
    carrera: "",
    ciclo: "1",
    creditosAprobados: "0",
    correo: "",
    clave: ""
  });
  const { error, enviando, enviar } = useEnvio(async () => {
    if (!CORREO_INSTITUCIONAL.test(datos.correo.trim())) {
      throw new Error("Usa tu correo institucional (@unsch.edu.pe).");
    }

    await sesion.registrar({ rol: "estudiante", ...datos });
  });
  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  return (
    <PantallaAcceso
      titulo="Cuenta institucional"
      pie={
        <p>
          ¿Ya tienes cuenta? <a href="#/ingresar">Ingresar</a>
          <br />
          ¿Eres una empresa?{" "}
          <a href="#/registro/empresa">Crear cuenta de empresa</a>
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
          etiqueta="Carrera profesional"
          name="carrera"
          value={datos.carrera}
          onChange={cambiar}
          required
          minLength={3}
          maxLength={150}
          placeholder="Ingeniería de Sistemas"
          ayuda="Escríbela como aparece en las ofertas."
        />
        <Campo
          etiqueta="Ciclo actual (1 a 10)"
          type="number"
          name="ciclo"
          value={datos.ciclo}
          onChange={cambiar}
          required
          min={1}
          max={10}
        />
        <Campo
          etiqueta="Créditos aprobados"
          type="number"
          name="creditosAprobados"
          value={datos.creditosAprobados}
          onChange={cambiar}
          required
          min={0}
          max={250}
          ayuda="Datos declarados; luego se validarán con SIGA."
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
        <AvisoError mensaje={error} />
        <button type="submit" disabled={enviando}>
          {enviando ? "Creando cuenta…" : "Crear cuenta institucional"}
        </button>
      </form>
    </PantallaAcceso>
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
    <PantallaAcceso
      titulo="Cuenta de empresa"
      pie={
        <p>
          ¿Ya tienes cuenta? <a href="#/ingresar">Ingresar</a>
          <br />
          ¿Eres estudiante?{" "}
          <a href="#/registro/institucional">Crear cuenta institucional</a>
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
        <AvisoError mensaje={error} />
        <p className="filtros__ayuda">
          La coordinación validará tu empresa antes de que puedas publicar
          ofertas.
        </p>
        <button type="submit" disabled={enviando}>
          {enviando ? "Creando cuenta…" : "Crear cuenta de empresa"}
        </button>
      </form>
    </PantallaAcceso>
  );
}
