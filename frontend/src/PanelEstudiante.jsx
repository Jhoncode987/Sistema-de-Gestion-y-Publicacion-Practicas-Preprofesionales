import { useCallback, useEffect, useState } from "react";
import { pedirApi } from "./api.js";
import { CICLOS, formatearFecha, formatearFechaHora } from "./formato.js";
import ListadoOfertas from "./ListadoOfertas.jsx";

const ESTADOS = {
  pendiente: { texto: "Pendiente", clase: "estado--revision" },
  aceptada: { texto: "Aceptada", clase: "estado--publicada" },
  rechazada: { texto: "Rechazada", clase: "estado--rechazada" },
  retirada: { texto: "Retirada", clase: "estado--cerrada" }
};

const perfilCompleto = (u) => u.carrera != null && u.ciclo != null && u.creditosAprobados != null;

// Perfil académico declarado: se pide a quien se registró antes de existir
// las postulaciones y puede corregirse después.
function PerfilAcademico({ usuario, sesion }) {
  const completo = perfilCompleto(usuario);
  const [editando, setEditando] = useState(!completo);
  const [datos, setDatos] = useState({
    carrera: usuario.carrera ?? "",
    ciclo: String(usuario.ciclo ?? 1),
    creditosAprobados: String(usuario.creditosAprobados ?? 0)
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function guardar(evento) {
    evento.preventDefault();
    setError("");
    setEnviando(true);

    try {
      await sesion.actualizarPerfilAcademico(datos);
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!editando) {
    return (
      <section className="perfil-academico" aria-label="Perfil académico">
        <p>
          <strong>Mi perfil académico:</strong> {usuario.carrera} · ciclo {usuario.ciclo} ·{" "}
          {usuario.creditosAprobados} créditos aprobados
        </p>
        <button type="button" className="boton-secundario" onClick={() => setEditando(true)}>
          Editar
        </button>
      </section>
    );
  }

  return (
    <section className="perfil-academico perfil-academico--formulario" aria-label="Perfil académico">
      <h2 className="titulo-seccion">
        {completo ? "Editar perfil académico" : "Completa tu perfil académico para postular"}
      </h2>
      <form onSubmit={guardar} className="formulario-oferta">
        <label className="campo">
          Carrera profesional
          <input name="carrera" value={datos.carrera} onChange={cambiar} required minLength={3} maxLength={150} placeholder="Ingeniería de Sistemas" />
        </label>
        <label className="campo">
          Ciclo actual
          <select name="ciclo" value={datos.ciclo} onChange={cambiar}>
            {CICLOS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="campo">
          Créditos aprobados
          <input type="number" name="creditosAprobados" value={datos.creditosAprobados} onChange={cambiar} required min={0} max={250} />
        </label>
        {error && <p className="aviso error campo--ancho" role="alert">{error}</p>}
        <div className="campo--ancho">
          <button type="submit" disabled={enviando}>{enviando ? "Guardando…" : "Guardar perfil"}</button>{" "}
          {completo && (
            <button type="button" className="boton-secundario" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function BotonPostular({ oferta, postulacion, puedePostular, token, alCambiar }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function postular() {
    setEnviando(true);
    setError(null);

    try {
      await pedirApi("/postulaciones", token, { metodo: "POST", cuerpo: { ofertaId: oferta.id } });
      await alCambiar();
    } catch (err) {
      setError(err);
      // Si ya existía o cambió su vigencia, la lista se actualiza igualmente.
      if (err.codigo === "POSTULACION_DUPLICADA") await alCambiar();
    } finally {
      setEnviando(false);
    }
  }

  if (postulacion) {
    const estado = ESTADOS[postulacion.estado];

    return (
      <p className="aviso aviso--exito">
        Ya postulaste · <span className={`etiqueta ${estado.clase}`}>{estado.texto}</span>
      </p>
    );
  }

  return (
    <div className="acciones-postulacion">
      <button type="button" onClick={postular} disabled={enviando || !puedePostular}
        title={puedePostular ? undefined : "Completa tu perfil académico para postular"}>
        {enviando ? "Postulando…" : "Postular"}
      </button>
      {error && (
        <div className="aviso error" role="alert">
          <p>{error.message}</p>
          {error.motivos.length > 0 && (
            <ul>{error.motivos.map((m) => <li key={m}>{m}</li>)}</ul>
          )}
        </div>
      )}
    </div>
  );
}

function MisPostulaciones({ token, items, error, alCambiar }) {
  const [errorAccion, setErrorAccion] = useState("");

  async function retirar(id) {
    setErrorAccion("");

    try {
      await pedirApi(`/postulaciones/${id}/retirar`, token, { metodo: "POST" });
      await alCambiar();
    } catch (err) {
      setErrorAccion(err.message);
    }
  }

  return (
    <section className="contenedor" id="mis-postulaciones" aria-labelledby="titulo-postulaciones">
      <h2 id="titulo-postulaciones" className="titulo-seccion">Mis postulaciones</h2>
      {error && <p className="aviso error" role="alert">{error}</p>}
      {errorAccion && <p className="aviso error" role="alert">{errorAccion}</p>}
      {!error && items.length === 0 && <p className="aviso">Todavía no has postulado a ninguna oferta.</p>}
      {items.length > 0 && (
        <div className="listado">
          {items.map((p) => {
            const estado = ESTADOS[p.estado] ?? { texto: p.estado, clase: "" };

            return (
              <article className="tarjeta" key={p.id}>
                <span className={`etiqueta ${estado.clase}`}>{estado.texto}</span>
                <h3>{p.oferta?.titulo ?? "Oferta no disponible"}</h3>
                <p className="empresa">{p.oferta?.empresa}</p>
                <p>Postulaste el {formatearFechaHora(p.creadaEn)}</p>
                {p.oferta?.estado === "cerrada" && p.estado === "pendiente" && (
                  <p className="aviso aviso--info">La oferta fue cerrada.</p>
                )}
                {p.estado === "rechazada" && p.motivo && (
                  <p className="aviso error">Motivo: {p.motivo}</p>
                )}
                {p.estado === "retirada" && p.motivo && (
                  <p className="aviso aviso--info">{p.motivo}</p>
                )}
                {p.estado === "aceptada" && (
                  <p className="aviso aviso--exito">¡Fuiste aceptado! La empresa se comunicará contigo.</p>
                )}
                {p.estado === "pendiente" && (
                  <button type="button" className="boton-secundario" onClick={() => retirar(p.id)}>
                    Retirar postulación
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function PanelEstudiante({ sesion }) {
  const { token, usuario, cerrarSesion } = sesion;
  const [postulaciones, setPostulaciones] = useState([]);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const datos = await pedirApi("/postulaciones/mias", token);
      setPostulaciones(datos.items);
      setError("");
      // La oferta pudo cerrarse por vacantes: se vuelve a pedir el listado.
      setRecarga((n) => n + 1);
    } catch (err) {
      if (err.estado === 401) return cerrarSesion();
      setError(err.message);
    }
  }, [token, cerrarSesion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const porOferta = new Map(postulaciones.map((p) => [String(p.ofertaId), p]));
  const completo = perfilCompleto(usuario);

  return (
    <>
      <div className="contenedor">
        <PerfilAcademico key={String(completo)} usuario={usuario} sesion={sesion} />
      </div>
      <ListadoOfertas
        token={token}
        alExpirar={cerrarSesion}
        conPortada
        claveRecarga={recarga}
        acciones={(oferta) => (
          <BotonPostular
            oferta={oferta}
            postulacion={porOferta.get(String(oferta.id))}
            puedePostular={completo}
            token={token}
            alCambiar={cargar}
          />
        )}
      />
      <MisPostulaciones token={token} items={postulaciones} error={error} alCambiar={cargar} />
    </>
  );
}
