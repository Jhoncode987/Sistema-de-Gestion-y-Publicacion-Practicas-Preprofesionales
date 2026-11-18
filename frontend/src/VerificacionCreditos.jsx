import { useCallback, useEffect, useState } from "react";
import { abrirPdf, pedirApi } from "./api.js";
import { formatearFechaHora } from "./formato.js";

const FILTROS = [
  ["pendientes", "Por verificar"],
  ["verificados", "Verificados"],
  ["todos", "Todos"]
];

// La coordinación abre el reporte de notas del estudiante, suma los créditos
// aprobados y registra el total; solo entonces el estudiante puede postular.
export default function VerificacionCreditos({ token, alExpirar }) {
  const [filtro, setFiltro] = useState("pendientes");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(null);
  const [creditos, setCreditos] = useState("");

  const cargar = useCallback(async () => {
    try {
      setDatos(await pedirApi(`/auth/estudiantes?estado=${filtro}&page=${pagina}`, token));
      setError("");
    } catch (err) {
      if (err.estado === 401) return alExpirar();
      setError(err.message);
    }
  }, [filtro, pagina, token, alExpirar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function verReporte(id) {
    setError("");

    try {
      await abrirPdf(`/auth/estudiantes/${id}/reporte`, token);
    } catch (err) {
      if (err.estado === 401) return alExpirar();
      setError(err.message);
    }
  }

  async function guardar(evento, id) {
    evento.preventDefault();
    setError("");

    try {
      await pedirApi(`/auth/estudiantes/${id}/verificacion`, token, {
        metodo: "PUT",
        cuerpo: { creditos: Number(creditos) }
      });
      setEditando(null);
    } catch (err) {
      if (err.estado === 401) return alExpirar();
      setError(err.message);
    }

    await cargar();
  }

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.pageSize)) : 1;

  return (
    <section aria-labelledby="titulo-verificacion" id="estudiantes">
      <h2 id="titulo-verificacion" className="titulo-seccion">Verificación de créditos</h2>
      <p className="filtros__ayuda">
        Abre el reporte de notas, suma los créditos aprobados y registra el total. Las prácticas exigen un mínimo de 160 créditos.
      </p>

      <div className="filtros-postulaciones">
        <label className="campo">
          Mostrar
          <select
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPagina(1);
            }}
          >
            {FILTROS.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
        </label>
        {datos && <p className="resultado">{datos.total} {datos.total === 1 ? "estudiante" : "estudiantes"}</p>}
      </div>

      {error && <p className="aviso error" role="alert">{error}</p>}
      {!datos && !error && <p role="status">Cargando…</p>}

      {datos && datos.items.length === 0 && <p className="aviso">No hay estudiantes con este filtro.</p>}

      {datos && datos.items.length > 0 && (
        <div className="listado">
          {datos.items.map((e) => (
            <article className="tarjeta" key={e.id}>
              <span className={`etiqueta ${e.creditosVerificados ? "estado--publicada" : "estado--revision"}`}>
                {e.creditosVerificados ? "Verificado" : e.tieneReporte ? "Reporte recibido" : "Sin reporte"}
              </span>
              <h3>{e.nombre}</h3>
              <p className="empresa">{e.codigoEstudiante} · {e.correo}</p>
              <dl className="detalles">
                <div><dt>Carrera</dt><dd>{e.carrera ?? "—"}</dd></div>
                <div><dt>Ciclo</dt><dd>{e.ciclo ?? "—"}</dd></div>
                <div>
                  <dt>{e.creditosVerificados ? "Créditos verificados" : "Créditos declarados"}</dt>
                  <dd>{e.creditosAprobados ?? "—"}</dd>
                </div>
                {e.creditosVerificados && (
                  <div><dt>Verificado</dt><dd>{formatearFechaHora(e.creditosVerificadosEn)}</dd></div>
                )}
              </dl>

              {editando !== e.id && (
                <div className="postulante__acciones">
                  {e.tieneReporte && (
                    <button type="button" className="boton-secundario" onClick={() => verReporte(e.id)}>
                      Ver reporte de notas
                    </button>
                  )}
                  {e.tieneReporte && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditando(e.id);
                        setCreditos(String(e.creditosAprobados ?? ""));
                      }}
                    >
                      {e.creditosVerificados ? "Corregir créditos" : "Registrar créditos"}
                    </button>
                  )}
                </div>
              )}

              {editando === e.id && (
                <form className="postulante__acciones" onSubmit={(ev) => guardar(ev, e.id)}>
                  <input
                    type="number"
                    value={creditos}
                    onChange={(ev) => setCreditos(ev.target.value)}
                    min={0}
                    max={250}
                    required
                    aria-label="Total de créditos aprobados según el reporte"
                    placeholder="Total de créditos"
                  />
                  <button type="submit">Verificar</button>
                  <button type="button" className="boton-secundario" onClick={() => setEditando(null)}>
                    Cancelar
                  </button>
                </form>
              )}
            </article>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <nav className="paginacion" aria-label="Paginación de estudiantes">
          <button type="button" className="boton-secundario" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
            Anterior
          </button>
          <span>Página {pagina} de {totalPaginas}</span>
          <button type="button" className="boton-secundario" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>
            Siguiente
          </button>
        </nav>
      )}
    </section>
  );
}
