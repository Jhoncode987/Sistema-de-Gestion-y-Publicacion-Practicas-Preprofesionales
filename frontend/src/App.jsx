import { useEffect, useState } from "react";
import {
  PaginaIngresar,
  PaginaRegistroEmpresa,
  PaginaRegistroInstitucional
} from "./Acceso.jsx";
import PanelCoordinador from "./PanelCoordinador.jsx";
import PanelEmpresa from "./PanelEmpresa.jsx";
import PanelEstudiante from "./PanelEstudiante.jsx";
import { useSesion } from "./sesion.js";
import "./App.css";

const SITIO_UNSCH = "https://enlinea.unsch.edu.pe/";

const ETIQUETA_ROL = {
  estudiante: "Estudiante",
  empresa: "Empresa",
  coordinador: "Coordinador"
};

// Rutas de acceso con el hash de la URL. Cualquier otro valor lleva al inicio
// de sesión (sin sesión) o al portal (con sesión), así que #ofertas sigue
// llevando a la lista.
const RUTAS_ACCESO = {
  "#/registro/institucional": PaginaRegistroInstitucional,
  "#/registro/empresa": PaginaRegistroEmpresa
};

function useHash() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const alCambiar = () => setHash(window.location.hash);

    window.addEventListener("hashchange", alCambiar);

    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);

  return hash;
}

function iniciales(nombre) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

function Portal({ sesion, hash }) {
  // Al abrir #ofertas (o volver al inicio), baja a la sección pedida.
  useEffect(() => {
    const id = hash.replace(/^#\/?/, "");
    document.getElementById(id)?.scrollIntoView();
  }, [hash]);

  const { usuario } = sesion;
  const esEmpresa = usuario.rol === "empresa";
  const esCoordinador = usuario.rol === "coordinador";

  return (
    <>
      <div className="barra-superior">
        <div className="barra-superior__interior">
          <span>Universidad Nacional de San Cristóbal de Huamanga</span>
          <a href={SITIO_UNSCH} target="_blank" rel="noopener noreferrer">
            Sitio institucional
          </a>
        </div>
      </div>

      <header className="cabecera">
        <div className="cabecera__interior">
          <a
            className="enlace-logo"
            href={SITIO_UNSCH}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="logo-unsch"
              src="/logo-unsch.png"
              alt="Universidad Nacional de San Cristóbal de Huamanga"
            />
          </a>

          <nav className="navegacion" aria-label="Principal">
            <a href="#/" aria-current="page">Inicio</a>
            {esEmpresa ? (
              <>
                <a href="#publicar">Publicar</a>
                <a href="#mis-ofertas">Mis ofertas</a>
              </>
            ) : esCoordinador ? (
              <>
                <a href="#empresas">Empresas</a>
                <a href="#ofertas-revision">Por revisar</a>
                <a href="#publicadas">Publicadas</a>
                <a href="#postulaciones">Postulaciones</a>
              </>
            ) : (
              <>
                <a href="#ofertas">Ofertas</a>
                <a href="#mis-postulaciones">Mis postulaciones</a>
              </>
            )}

            <div className="usuario">
              <div className="usuario__datos">
                <span className="usuario__nombre">{usuario.nombre}</span>
                <span className="usuario__rol">{ETIQUETA_ROL[usuario.rol]}</span>
              </div>
              <span className="usuario__avatar" aria-hidden="true">
                {iniciales(usuario.nombre)}
              </span>
              <button
                type="button"
                className="boton-secundario"
                onClick={sesion.cerrarSesion}
              >
                Salir
              </button>
            </div>
          </nav>
        </div>
      </header>

      {esEmpresa ? (
        <PanelEmpresa token={sesion.token} alExpirar={sesion.cerrarSesion} />
      ) : esCoordinador ? (
        <PanelCoordinador token={sesion.token} alExpirar={sesion.cerrarSesion} />
      ) : (
        <PanelEstudiante sesion={sesion} />
      )}

      <footer className="pie">
        <div className="pie__interior">
          <img
            className="pie__logo"
            src="/logo-unsch.png"
            alt=""
            aria-hidden="true"
          />
          <p>
            Universidad Nacional de San Cristóbal de Huamanga
            <br />
            <span>Portal de prácticas preprofesionales</span>
          </p>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  const sesion = useSesion();
  const hash = useHash();
  const conSesion = Boolean(sesion.usuario);
  const esRutaAcceso = hash === "#/ingresar" || hash in RUTAS_ACCESO;

  // Con la sesión iniciada no tiene sentido ver las pantallas de acceso.
  useEffect(() => {
    if (conSesion && esRutaAcceso) {
      window.location.hash = "#/";
    }
  }, [conSesion, esRutaAcceso]);

  if (sesion.restaurando) {
    return <p className="cargando-sesion" role="status">Cargando…</p>;
  }

  if (!conSesion) {
    const Pagina = RUTAS_ACCESO[hash] ?? PaginaIngresar;

    return <Pagina sesion={sesion} />;
  }

  return <Portal sesion={sesion} hash={hash} />;
}
