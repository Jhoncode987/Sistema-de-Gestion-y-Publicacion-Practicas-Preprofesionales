import { useEffect, useState } from "react";
import { CICLOS, MODALIDADES, formatearFecha } from "./formato.js";

// En desarrollo queda vacío y Vite redirige /api al backend.
// En producción se define VITE_API_URL con la dirección del backend.
const URL_API = import.meta.env.VITE_API_URL ?? "";

const FILTROS_VACIOS = { q: "", modalidad: "", carrera: "", ciclo: "" };
const POR_DEFECTO = { items: [], total: 0, pageSize: 9 };

// Lista de ofertas publicadas con filtros y paginación. La usan el estudiante
// (con portada) y el coordinador, que recibe "acciones" para cerrar ofertas.
export default function ListadoOfertas({
  token,
  alExpirar,
  conPortada = false,
  acciones,
  claveRecarga = 0,
  idSeccion = "ofertas",
  titulo = "Ofertas disponibles"
}) {
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
  }, [consulta, token, alExpirar, claveRecarga]);

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
    document.getElementById(idSeccion)?.scrollIntoView({ behavior: "smooth" });
  }

  const Contenedor = conPortada ? "main" : "div";
  const { items, total, pageSize } = resultado;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const primera = (consulta.page - 1) * pageSize + 1;
  const ultima = primera + items.length - 1;
  const hayFiltros = Boolean(
    consulta.q || consulta.modalidad || consulta.carrera || consulta.ciclo
  );

  return (
    <>
      {conPortada && (
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
      )}

      <Contenedor className={conPortada ? "contenedor" : undefined} id={idSeccion}>
        <section aria-labelledby={`titulo-${idSeccion}`}>
          <h2 id={`titulo-${idSeccion}`} className="titulo-seccion">
            {titulo}
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

                    {acciones?.(oferta)}
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
      </Contenedor>

    </>
  );
}
