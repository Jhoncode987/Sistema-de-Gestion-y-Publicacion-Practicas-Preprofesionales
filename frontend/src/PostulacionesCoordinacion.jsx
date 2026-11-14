import { useCallback, useEffect, useState } from "react";
import { pedirApi } from "./api.js";
import { formatearFechaHora } from "./formato.js";

const ESTADOS = {
  pendiente: { texto: "Pendientes", uno: "Pendiente", clase: "estado--revision" },
  aceptada: { texto: "En práctica", uno: "Aceptada", clase: "estado--publicada" },
  finalizada: { texto: "Finalizadas", uno: "Finalizada", clase: "estado--cerrada" },
  rechazada: { texto: "Rechazadas", uno: "Rechazada", clase: "estado--rechazada" },
  retirada: { texto: "Retiradas", uno: "Retirada", clase: "estado--cerrada" }
};

// Resumen general y listado de postulaciones; la coordinación puede finalizar
// una práctica aceptada.
export default function PostulacionesCoordinacion({ token, alExpirar }) {
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [finalizando, setFinalizando] = useState(null);

  const cargar = useCallback(async () => {
    const consulta = new URLSearchParams({ page: String(pagina) });
    if (estado) consulta.set("estado", estado);

    try {
      setDatos(await pedirApi(`/postulaciones/coordinacion?${consulta}`, token));
      setError("");
    } catch (err) {
      if (err.estado === 401) return alExpirar();
      setError(err.message);
    }
  }, [estado, pagina, token, alExpirar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function finalizar(id) {
    setError("");

    try {
      await pedirApi(`/postulaciones/${id}/finalizar`, token, { metodo: "POST" });
      setFinalizando(null);
    } catch (err) {
      setError(err.message);
    }

    await cargar();
  }

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.pageSize)) : 1;

  return (
    <section aria-labelledby="titulo-postulaciones-coord" id="postulaciones">
      <h2 id="titulo-postulaciones-coord" className="titulo-seccion">Postulaciones</h2>

      {error && <p className="aviso error" role="alert">{error}</p>}
      {!datos && !error && <p role="status">Cargando…</p>}

      {datos && (
        <>
          <div className="resumen-cifras" role="list" aria-label="Resumen de postulaciones">
            <div className="cifra" role="listitem">
              <strong>{datos.resumen.total}</strong>
              <span>Total</span>
            </div>
            {Object.entries(ESTADOS).map(([clave, e]) => (
              <div className="cifra" role="listitem" key={clave}>
                <strong>{datos.resumen[clave]}</strong>
                <span>{e.texto}</span>
              </div>
            ))}
          </div>

          <div className="filtros-postulaciones">
            <label className="campo">
              Estado
              <select
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value);
                  setPagina(1);
                }}
              >
                <option value="">Todos</option>
                {Object.entries(ESTADOS).map(([clave, e]) => (
                  <option key={clave} value={clave}>{e.uno}</option>
                ))}
              </select>
            </label>
            <p className="resultado">
              {datos.total} {datos.total === 1 ? "postulación" : "postulaciones"}
            </p>
          </div>

          {datos.items.length === 0 ? (
            <p className="aviso">No hay postulaciones con este filtro.</p>
          ) : (
            <div className="listado">
              {datos.items.map((p) => {
                const e = ESTADOS[p.estado] ?? { uno: p.estado, clase: "" };

                return (
                  <article className="tarjeta" key={p.id}>
                    <span className={`etiqueta ${e.clase}`}>{e.uno}</span>
                    <h3>{p.oferta?.titulo ?? "Oferta no disponible"}</h3>
                    <p className="empresa">{p.oferta?.empresa}</p>
                    <dl className="detalles">
                      <div>
                        <dt>Estudiante</dt>
                        <dd>{p.estudiante?.nombre ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>Código</dt>
                        <dd>{p.estudiante?.codigoEstudiante ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>Carrera</dt>
                        <dd>{p.estudiante?.carrera ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>Postuló</dt>
                        <dd>{formatearFechaHora(p.creadaEn)}</dd>
                      </div>
                    </dl>
                    {p.motivo && <p className="filtros__ayuda">Motivo: {p.motivo}</p>}

                    {p.estado === "aceptada" && finalizando !== p.id && (
                      <button type="button" className="boton-secundario" onClick={() => setFinalizando(p.id)}>
                        Finalizar práctica
                      </button>
                    )}
                    {p.estado === "aceptada" && finalizando === p.id && (
                      <div className="postulante__acciones">
                        <span>¿La práctica ya terminó?</span>
                        <button type="button" onClick={() => finalizar(p.id)}>Sí, finalizar</button>
                        <button type="button" className="boton-secundario" onClick={() => setFinalizando(null)}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {totalPaginas > 1 && (
            <nav className="paginacion" aria-label="Paginación de postulaciones">
              <button type="button" className="boton-secundario" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
                Anterior
              </button>
              <span>Página {pagina} de {totalPaginas}</span>
              <button type="button" className="boton-secundario" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
