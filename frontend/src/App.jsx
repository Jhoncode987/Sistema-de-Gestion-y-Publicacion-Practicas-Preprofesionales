import { useEffect, useState } from "react";
import {
  PaginaIngresar,
  PaginaRegistroEmpresa,
  PaginaRegistroInstitucional
} from "./Acceso.jsx";
import PanelEmpresa from "./PanelEmpresa.jsx";
import { CICLOS, MODALIDADES, formatearFecha } from "./formato.js";
import { useSesion } from "./sesion.js";
import "./App.css";

const SITIO_UNSCH = "https://enlinea.unsch.edu.pe/";

// En desarrollo queda vacío y Vite redirige /api al backend.
// En producción se define VITE_API_URL con la dirección del backend.
const URL_API = import.meta.env.VITE_API_URL ?? "";

const FILTROS_VACIOS = { q: "", modalidad: "", carrera: "", ciclo: "" };
const POR_DEFECTO = { items: [], total: 0, pageSize: 9 };

const ETIQUETA_ROL = {
  estudiante: "Estudiante",
  empresa: "Empresa",
  coordinador: "Coordinador"
};

function Inicio({ token, alExpirar }) {
  const [carreras, setCarreras] = useState([]);
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [consulta, setConsulta] = useState({ ...FILTROS_VACIOS, page: 1 });
  const [resultado, setResultado] = useState(POR_DEFECTO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Carreras disponibles para el filtro. Si falla, el filtro queda sin opciones.
  useEffect(() => {
    const controller = new AbortController();

    async function cargarFiltros() {
      try {
        const respuesta = await fetch(`${URL_API}/api/v1/ofertas/filtros`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (respuesta.status === 401) {
          return alExpirar();
        }

        const datos = await respuesta.json();

        if (respuesta.ok && Array.isArray(datos.carreras)) {
          setCarreras(datos.carreras);
        }
      } catch {
        // Sin filtros de carrera el portal sigue funcionando.
      }
    }

    cargarFiltros();

    return () => controller.abort();
  }, [token, alExpirar]);

  // Ofertas según la búsqueda aplicada y la página actual.
  useEffect(() => {
    const controller = new AbortController();

    async function cargarOfertas() {
      try {
        const parametros = new URLSearchParams();

        for (const [clave, valor] of Object.entries(consulta)) {
          if (valor !== "") {
            parametros.set(clave, String(valor));
          }
        }

        const respuesta = await fetch(
          `${URL_API}/api/v1/ofertas?${parametros}`,
          {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (respuesta.status === 401) {
          return alExpirar();
        }

        const datos = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          throw new Error(
            datos?.mensaje ?? "No se pudieron obtener las ofertas."
          );
        }

        if (!datos || !Array.isArray(datos.items)) {
          throw new Error("El servidor devolvió un formato inesperado.");
        }

        setResultado({
          items: datos.items,
          total: datos.total,
          pageSize: datos.pageSize
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarOfertas();

    return () => controller.abort();
  }, [consulta, token, alExpirar]);

  function cambiarConsulta(nueva) {
    setCargando(true);
    setError("");
    setConsulta(nueva);
  }

  function cambiarCampo(evento) {
    const { name, value } = evento.target;
    setBorrador((anterior) => ({ ...anterior, [name]: value }));
  }

  function buscar(evento) {
    evento.preventDefault();
    cambiarConsulta({ ...borrador, page: 1 });
  }

  function limpiar() {
    setBorrador(FILTROS_VACIOS);
    cambiarConsulta({ ...FILTROS_VACIOS, page: 1 });
  }

  function irAPagina(pagina) {
    cambiarConsulta({ ...consulta, page: pagina });
    document.getElementById("ofertas")?.scrollIntoView({ behavior: "smooth" });
  }

  const { items, total, pageSize } = resultado;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const primera = (consulta.page - 1) * pageSize + 1;
  const ultima = primera + items.length - 1;
  const hayFiltros = Boolean(
    consulta.q || consulta.modalidad || consulta.carrera || consulta.ciclo
  );

  return (
    <>
      <section className="hero" id="inicio">
        <div className="hero__interior">
          <p className="hero__etiqueta">Portal de oportunidades</p>
          <h1>Prácticas preprofesionales</h1>
          <p className="hero__texto">
            Conectamos tu formación con nuevas experiencias profesionales.
          </p>
          <a className="boton-dorado" href="#ofertas">
            Ver ofertas
          </a>
        </div>
      </section>

      <main className="contenedor" id="ofertas">
        <section aria-labelledby="titulo-ofertas">
          <h2 id="titulo-ofertas" className="titulo-seccion">
            Ofertas disponibles
          </h2>

          <form className="filtros" onSubmit={buscar} role="search">
            <label className="campo campo--buscar">
              Buscar
              <input
                type="search"
                name="q"
                value={borrador.q}
                onChange={cambiarCampo}
                placeholder="Título, empresa o descripción"
                maxLength={100}
              />
            </label>

            <label className="campo">
              Carrera
              <select
                name="carrera"
                value={borrador.carrera}
                onChange={cambiarCampo}
              >
                <option value="">Todas</option>
                {carreras.map((carrera) => (
                  <option key={carrera} value={carrera}>
                    {carrera}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              Modalidad
              <select
                name="modalidad"
                value={borrador.modalidad}
                onChange={cambiarCampo}
              >
                <option value="">Todas</option>
                {MODALIDADES.map(({ valor, etiqueta }) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              Mi ciclo
              <select
                name="ciclo"
                value={borrador.ciclo}
                onChange={cambiarCampo}
              >
                <option value="">Cualquiera</option>
                {CICLOS.map((ciclo) => (
                  <option key={ciclo} value={ciclo}>
                    {ciclo}
                  </option>
                ))}
              </select>
            </label>

            <div className="filtros__acciones">
              <button type="submit">Buscar</button>
              <button
                type="button"
                className="boton-secundario"
                onClick={limpiar}
              >
                Limpiar
              </button>
            </div>

            <p className="filtros__ayuda">
              «Mi ciclo» muestra las ofertas cuyo ciclo mínimo es igual o menor
              al tuyo.
            </p>
          </form>

          {cargando && <p role="status">Cargando ofertas…</p>}

          {error && (
            <div className="aviso error" role="alert">
              <p>{error}</p>
              <button onClick={() => cambiarConsulta({ ...consulta })}>
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && total === 0 && (
            <p className="aviso">
              {hayFiltros
                ? "No se encontraron ofertas con esos filtros."
                : "No hay ofertas publicadas y vigentes."}
            </p>
          )}

          {!error && items.length > 0 && (
            <>
              <p className="resultado">
                Mostrando {primera}–{ultima} de {total}{" "}
                {total === 1 ? "oferta" : "ofertas"}
              </p>

              <div
                className={`listado${cargando ? " listado--cargando" : ""}`}
                aria-busy={cargando}
              >
                {items.map((oferta) => (
                  <article className="tarjeta" key={oferta.id}>
                    <span className="etiqueta">
                      {MODALIDADES.find((m) => m.valor === oferta.modalidad)
                        ?.etiqueta ?? oferta.modalidad}
                    </span>

                    <h3>{oferta.titulo}</h3>
                    <p className="empresa">{oferta.empresa}</p>
                    <p>{oferta.descripcion}</p>

                    <dl className="detalles">
                      <div>
                        <dt>Carrera</dt>
                        <dd>{oferta.carrera}</dd>
                      </div>
                      <div>
                        <dt>Ciclo mínimo</dt>
                        <dd>{oferta.ciclo_minimo}</dd>
                      </div>
                      <div>
                        <dt>Créditos mínimos</dt>
                        <dd>{oferta.creditos_minimos}</dd>
                      </div>
                      <div>
                        <dt>Vacantes</dt>
                        <dd>{oferta.vacantes}</dd>
                      </div>
                      <div>
                        <dt>Fecha límite</dt>
                        <dd>{formatearFecha(oferta.fecha_limite)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              {totalPaginas > 1 && (
                <nav className="paginacion" aria-label="Paginación">
                  <button
                    className="boton-secundario"
                    disabled={cargando || consulta.page <= 1}
                    onClick={() => irAPagina(consulta.page - 1)}
                  >
                    ← Anterior
                  </button>
                  <span>
                    Página {consulta.page} de {totalPaginas}
                  </span>
                  <button
                    className="boton-secundario"
                    disabled={cargando || consulta.page >= totalPaginas}
                    onClick={() => irAPagina(consulta.page + 1)}
                  >
                    Siguiente →
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>

    </>
  );
}

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
            ) : (
              <a href="#ofertas">Ofertas</a>
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
      ) : (
        <Inicio token={sesion.token} alExpirar={sesion.cerrarSesion} />
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
