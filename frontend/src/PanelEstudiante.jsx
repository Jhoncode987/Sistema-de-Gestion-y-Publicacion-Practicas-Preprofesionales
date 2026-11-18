import { useCallback, useEffect, useState } from "react";
import { pedirApi } from "./api.js";
import { CICLOS, formatearFecha, formatearFechaHora } from "./formato.js";
import ListadoOfertas from "./ListadoOfertas.jsx";

const ESTADOS = {
  pendiente: { texto: "Pendiente", clase: "estado--revision" },
  aceptada: { texto: "Aceptada", clase: "estado--publicada" },
  rechazada: { texto: "Rechazada", clase: "estado--rechazada" },
  retirada: { texto: "Retirada", clase: "estado--cerrada" },
  finalizada: { texto: "Finalizada", clase: "estado--cerrada" }
};

const perfilCompleto = (u) => u.carrera != null && u.ciclo != null && u.creditosAprobados != null;

// Perfil académico declarado: se pide a quien se registró antes de existir
// las postulaciones y puede corregirse después.
// Mínimo de créditos para prácticas según la norma de la Escuela.
const CREDITOS_MINIMOS_PRACTICAS = 160;

// Estado de la verificación de créditos y subida del reporte de notas (PDF).
function VerificacionCreditos({ usuario, sesion }) {
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function subir(evento) {
    evento.preventDefault();
    setError("");
    setAviso("");

    if (!archivo) return setError("Elige tu reporte de notas en PDF.");
    if (archivo.size > 2 * 1024 * 1024) return setError("El archivo no puede superar 2 MB.");

    setEnviando(true);

    try {
      await pedirApi("/auth/reporte-notas", sesion.token, { metodo: "PUT", archivo });
      await sesion.recargarUsuario();
      setArchivo(null);
      setAviso("Reporte enviado. La coordinación verificará tus créditos.");
      evento.target.reset();
    } catch (err) {
      if (err.estado === 401) return sesion.cerrarSesion();
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (usuario.creditosVerificados) {
    const faltan = CREDITOS_MINIMOS_PRACTICAS - usuario.creditosAprobados;

    if (faltan > 0) {
      return (
        <p className="aviso aviso--info">
          Créditos verificados por la coordinación: {usuario.creditosAprobados}. Las prácticas exigen
          un mínimo de {CREDITOS_MINIMOS_PRACTICAS}; te faltan {faltan} para poder postular.
        </p>
      );
    }

    return (
      <p className="aviso aviso--exito">
        Créditos verificados por la coordinación: {usuario.creditosAprobados}. Ya puedes postular.
      </p>
    );
  }

  return (
    <section className="perfil-academico" aria-label="Verificación de créditos">
      <p className="aviso aviso--info">
        {usuario.tieneReporte
          ? "Tu reporte de notas está en revisión. Podrás postular cuando la coordinación verifique tus créditos."
          : "Para postular, la coordinación debe verificar tus créditos. Descarga tu reporte de notas desde el intranet y súbelo aquí en PDF."}
      </p>
      <form onSubmit={subir} className="postulante__acciones">
        <input
          type="file"
          accept="application/pdf"
          aria-label="Reporte de notas en PDF"
          onChange={(e) => setArchivo(e.target.files[0] ?? null)}
        />
        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : usuario.tieneReporte ? "Reemplazar reporte" : "Subir reporte"}
        </button>
      </form>
      {aviso && <p className="aviso aviso--exito" role="status">{aviso}</p>}
      {error && <p className="aviso error" role="alert">{error}</p>}
    </section>
  );
}

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

function BotonPostular({ oferta, postulacion, puedePostular, enPractica, token, alCambiar }) {
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
      <p className={postulacion.estado === "finalizada" ? "aviso aviso--info" : "aviso aviso--exito"}>
        {postulacion.estado === "finalizada" ? "Práctica realizada" : "Ya postulaste"} ·{" "}
        <span className={`etiqueta ${estado.clase}`}>{estado.texto}</span>
      </p>
    );
  }

  return (
    <div className="acciones-postulacion">
      <button type="button" onClick={postular} disabled={enviando || !puedePostular || enPractica}
        title={puedePostular ? undefined : "Completa tu perfil académico para postular"}>
        {enviando ? "Postulando…" : enPractica ? "Ya estás en una práctica" : "Postular"}
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
                {["aceptada", "finalizada"].includes(p.estado) && (
                  <p className="filtros__ayuda">
                    {p.asesorNombre
                      ? `Docente asesor: ${p.asesorNombre}`
                      : "Docente asesor: la coordinación aún no lo asigna"}
                  </p>
                )}
                {p.estado === "finalizada" && (
                  <p className="aviso aviso--info">Práctica finalizada. Ya puedes postular a nuevas ofertas.</p>
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
  const enPractica = postulaciones.some((p) => p.estado === "aceptada");

  return (
    <>
      <div className="contenedor">
        <PerfilAcademico key={String(completo)} usuario={usuario} sesion={sesion} />
        {completo && <VerificacionCreditos usuario={usuario} sesion={sesion} />}
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
            enPractica={enPractica}
            token={token}
            alCambiar={cargar}
          />
        )}
      />
      <MisPostulaciones token={token} items={postulaciones} error={error} alCambiar={cargar} />
    </>
  );
}
