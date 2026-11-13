import { useEffect, useState } from "react";
import "./App.css";

const SITIO_UNSCH = "https://enlinea.unsch.edu.pe/";

// En desarrollo queda vacío y Vite redirige /api al backend.
// En producción se define VITE_API_URL con la dirección del backend.
const URL_API = import.meta.env.VITE_API_URL ?? "";

const CICLOS = Array.from({ length: 10 }, (_, i) => i + 1);

const MODALIDADES = [
  { valor: "presencial", etiqueta: "Presencial" },
  { valor: "remota", etiqueta: "Remota" },
  { valor: "hibrida", etiqueta: "Híbrida" }
];

const FILTROS_VACIOS = { q: "", modalidad: "", carrera: "", ciclo: "" };
const POR_DEFECTO = { items: [], total: 0, pageSize: 9 };

export default function App() {
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
          signal: controller.signal
        });
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
  }, []);

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
          { signal: controller.signal }
        );
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
  }, [consulta]);

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

  // La fecha límite es un DATE de PostgreSQL: llega como medianoche UTC,
  // por eso se formatea en UTC para no mostrar un día menos.
  function formatearFecha(valor) {
    const fecha = new Date(valor);

    return Number.isNaN(fecha.getTime())
      ? "Fecha no disponible"
      : fecha.toLocaleDateString("es-PE", {
          timeZone: "UTC"
        });
  }

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
            <a href="#inicio" aria-current="page">Inicio</a>
            <a href="#ofertas">Ofertas</a>
          </nav>
        </div>
      </header>

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
