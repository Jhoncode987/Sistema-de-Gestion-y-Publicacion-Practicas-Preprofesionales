import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarOfertas() {
      try {
        const respuesta = await fetch("/api/v1/ofertas", {
          signal: controller.signal
        });

        if (!respuesta.ok) {
          throw new Error("No se pudieron obtener las ofertas.");
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos.ofertas)) {
          throw new Error("El servidor devolvió un formato inesperado.");
        }

        setOfertas(datos.ofertas);
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
  }, []);

  function formatearFecha(valor) {
    const fecha = new Date(valor);

    return Number.isNaN(fecha.getTime())
      ? "Fecha no disponible"
      : fecha.toLocaleDateString("es-PE", {
          timeZone: "America/Lima"
        });
  }

  return (
    <main className="contenedor">
      <header className="cabecera">
        <a 
          className="enlace-logo"
          href="https://enlinea.unsch.edu.pe/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className="logo-unsch"
            src="/logo-unsch.png"
            alt="Universidad Nacional de San Cristóbal de Huamanga"
          />
        </a>
        
        <div className="titulo-portal">
          <p className="institucion">Portal de oportunidades</p>
          <h1>Prácticas preprofesionales</h1>
          <p>Conectamos tu formación con nuevas experiencias profesionales.</p>
        </div>
      </header>

      <section aria-labelledby="titulo-ofertas">
        <h2 id="titulo-ofertas">Ofertas disponibles</h2>

        {cargando && <p role="status">Cargando ofertas…</p>}

        {error && (
          <div className="aviso error" role="alert">
            <p>{error}</p>
            <p>Comprueba que el backend esté ejecutándose en el puerto 3000.</p>
            <button onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && ofertas.length === 0 && (
          <p className="aviso">No hay ofertas publicadas y vigentes.</p>
        )}

        {!cargando && !error && ofertas.length > 0 && (
          <>
            <p className="resultado">
              Ofertas mostradas: {ofertas.length}
            </p>

            <div className="listado">
              {ofertas.map((oferta) => (
                <article className="tarjeta" key={oferta.id}>
                  <span className="etiqueta">
                    {oferta.modalidad}
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
          </>
        )}
      </section>
    </main>
  );
}
