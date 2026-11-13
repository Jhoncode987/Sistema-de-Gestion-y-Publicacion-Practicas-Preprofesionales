import { useCallback, useEffect, useState } from "react";
import { pedirApi } from "./api.js";
import { CICLOS, MODALIDADES, formatearFecha, formatearFechaHora } from "./formato.js";

const URL_API = import.meta.env.VITE_API_URL ?? "";

const ESTADOS = {
  pendiente_revision: { texto: "En revisión", clase: "estado--revision" },
  publicada: { texto: "Publicada", clase: "estado--publicada" },
  rechazada: { texto: "Rechazada", clase: "estado--rechazada" },
  cerrada: { texto: "Cerrada", clase: "estado--cerrada" },
  vencida: { texto: "Vencida", clase: "estado--cerrada" }
};

const FORMULARIO_VACIO = {
  titulo: "",
  descripcion: "",
  carrera: "",
  ciclo_minimo: "1",
  creditos_minimos: "0",
  modalidad: "presencial",
  vacantes: "1",
  fecha_limite: ""
};

// Mañana en formato AAAA-MM-DD, hora local: la fecha límite debe ser posterior a hoy.
function manana() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);

  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0")
  ].join("-");
}

async function pedir(ruta, token, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${URL_API}/api/v1/ofertas${ruta}`, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.body ? { "Content-Type": "application/json" } : {})
      }
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const error = new Error(datos?.mensaje ?? "No se pudo completar la solicitud.");
    error.estado = respuesta.status;
    throw error;
  }

  return datos;
}

const ESTADOS_POSTULACION = {
  pendiente: { texto: "Pendiente", clase: "estado--revision" },
  aceptada: { texto: "Aceptada", clase: "estado--publicada" },
  rechazada: { texto: "Rechazada", clase: "estado--rechazada" },
  retirada: { texto: "Retirada", clase: "estado--cerrada" },
  finalizada: { texto: "Finalizada", clase: "estado--cerrada" }
};

// Postulantes de una oferta: la empresa acepta o rechaza. Al aceptar al último
// de las vacantes la oferta se cierra sola y se avisa aquí.
function Postulantes({ oferta, token, alCambiarOferta }) {
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [rechazando, setRechazando] = useState(null);
  const [finalizando, setFinalizando] = useState(null);
  const [motivo, setMotivo] = useState("");

  const cargar = useCallback(async () => {
    try {
      setDatos(await pedirApi(`/postulaciones/oferta/${oferta.id}`, token));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [oferta.id, token]);

  useEffect(() => {
    if (abierto) cargar();
  }, [abierto, cargar]);

  async function decidir(id, accion, cuerpo) {
    setError("");
    setAviso("");

    try {
      const r = await pedirApi(`/postulaciones/${id}/${accion}`, token, { metodo: "POST", cuerpo });
      if (r.ofertaCerrada) {
        setAviso("Se cubrieron todas las vacantes: la oferta se cerró y las demás postulaciones pendientes se rechazaron.");
        await alCambiarOferta();
      }
      setRechazando(null);
      setFinalizando(null);
      setMotivo("");
    } catch (err) {
      setError(err.message);
    }
    await cargar();
  }

  return (
    <div className="postulantes">
      <button type="button" className="boton-secundario" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
        {abierto ? "Ocultar postulantes" : "Ver postulantes"}
      </button>

      {abierto && (
        <div className="postulantes__lista">
          {error && <p className="aviso error" role="alert">{error}</p>}
          {aviso && <p className="aviso aviso--info" role="status">{aviso}</p>}
          {!datos && !error && <p role="status">Cargando…</p>}
          {datos && (
            <>
              <p className="resultado">
                {datos.aceptadas} de {datos.oferta.vacantes} vacantes cubiertas · {datos.items.length}{" "}
                {datos.items.length === 1 ? "postulación" : "postulaciones"}
              </p>
              {datos.items.length === 0 && <p className="aviso">Aún no hay postulaciones.</p>}
              {datos.items.map((p) => {
                const estado = ESTADOS_POSTULACION[p.estado] ?? { texto: p.estado, clase: "" };

                return (
                  <div className="postulante" key={p.id}>
                    <div>
                      <strong>{p.estudiante?.nombre ?? "Estudiante"}</strong>{" "}
                      <span className={`etiqueta ${estado.clase}`}>{estado.texto}</span>
                      {p.estudiante && (
                        <p className="postulante__datos">
                          {p.estudiante.carrera} · ciclo {p.estudiante.ciclo} · {p.estudiante.creditosAprobados} créditos
                          <br />
                          Código {p.estudiante.codigoEstudiante} · {p.estudiante.correo}
                        </p>
                      )}
                      <p className="postulante__datos">Postuló el {formatearFechaHora(p.creadaEn)}</p>
                      {p.estado === "rechazada" && p.motivo && <p className="postulante__datos">Motivo: {p.motivo}</p>}
                    </div>

                    {p.estado === "pendiente" && rechazando !== p.id && (
                      <div className="postulante__acciones">
                        <button type="button" onClick={() => decidir(p.id, "aceptar")}>Aceptar</button>
                        <button type="button" className="boton-secundario" onClick={() => setRechazando(p.id)}>Rechazar</button>
                      </div>
                    )}

                    {p.estado === "aceptada" && finalizando !== p.id && (
                      <div className="postulante__acciones">
                        <button type="button" className="boton-secundario" onClick={() => setFinalizando(p.id)}>
                          Finalizar práctica
                        </button>
                      </div>
                    )}

                    {p.estado === "aceptada" && finalizando === p.id && (
                      <div className="postulante__acciones">
                        <span>¿La práctica ya terminó?</span>
                        <button type="button" onClick={() => decidir(p.id, "finalizar")}>Sí, finalizar</button>
                        <button type="button" className="boton-secundario" onClick={() => setFinalizando(null)}>Cancelar</button>
                      </div>
                    )}

                    {p.estado === "pendiente" && rechazando === p.id && (
                      <div className="postulante__acciones">
                        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} placeholder="Motivo (opcional)" aria-label="Motivo del rechazo" />
                        <button type="button" onClick={() => decidir(p.id, "rechazar", { motivo })}>Confirmar rechazo</button>
                        <button type="button" className="boton-secundario" onClick={() => setRechazando(null)}>Cancelar</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Cierre en dos pasos: evita cerrar una oferta por un clic accidental.
function CerrarOferta({ alCerrar }) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function cerrar() {
    setEnviando(true);
    setError("");

    try {
      await alCerrar();
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  if (!confirmando) {
    return (
      <div className="decision">
        <div className="decision__botones">
          <button
            type="button"
            className="boton-secundario"
            onClick={() => setConfirmando(true)}
          >
            Cerrar oferta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="decision">
      <p className="filtros__ayuda">
        La oferta dejará de mostrarse a los estudiantes y no se puede reabrir.
      </p>
      <div className="decision__botones">
        <button
          type="button"
          className="boton-peligro"
          disabled={enviando}
          onClick={cerrar}
        >
          Sí, cerrar
        </button>
        <button
          type="button"
          className="boton-secundario"
          disabled={enviando}
          onClick={() => setConfirmando(false)}
        >
          No
        </button>
      </div>
      {error && (
        <p className="aviso error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function PanelEmpresa({ token, alExpirar }) {
  const [panel, setPanel] = useState(null);
  const [carreras, setCarreras] = useState([]);
  const [errorCarga, setErrorCarga] = useState("");
  const [datos, setDatos] = useState(FORMULARIO_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [exito, setExito] = useState("");

  const cargar = useCallback(async () => {
    try {
      setPanel(await pedir("/mias", token));
      setErrorCarga("");
    } catch (error) {
      if (error.estado === 401) {
        return alExpirar();
      }

      setErrorCarga(error.message);
    }
  }, [token, alExpirar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Carreras ya usadas en el portal, como sugerencia al escribir.
  useEffect(() => {
    pedir("/filtros", token)
      .then((d) => Array.isArray(d.carreras) && setCarreras(d.carreras))
      .catch(() => {});
  }, [token]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setExito("");
    setDatos((anterior) => ({ ...anterior, [name]: value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErrorEnvio("");
    setExito("");
    setEnviando(true);

    try {
      await pedir("", token, {
        method: "POST",
        body: JSON.stringify({
          ...datos,
          ciclo_minimo: Number(datos.ciclo_minimo),
          creditos_minimos: Number(datos.creditos_minimos),
          vacantes: Number(datos.vacantes)
        })
      });

      setDatos(FORMULARIO_VACIO);
      setExito("Oferta enviada. La coordinación la revisará antes de publicarla.");
      await cargar();
    } catch (error) {
      if (error.estado === 401) {
        return alExpirar();
      }

      setErrorEnvio(error.message);
    } finally {
      setEnviando(false);
    }
  }

  const empresa = panel?.empresa;

  function cerrar(id) {
    return async () => {
      try {
        await pedir(`/${id}/cerrar`, token, { method: "POST" });
      } catch (error) {
        if (error.estado === 401) {
          return alExpirar();
        }

        await cargar();
        throw error;
      }

      await cargar();
    };
  }

  return (
    <>
      <section className="hero hero--panel" id="inicio">
        <div className="hero__interior">
          <p className="hero__etiqueta">Panel de empresa</p>
          <h1>{empresa?.razonSocial ?? "Mi empresa"}</h1>
          <p className="hero__texto">
            Publica tus ofertas de prácticas y revisa su estado de validación.
          </p>
          <a className="boton-dorado" href="#publicar">
            Publicar oferta
          </a>
        </div>
      </section>

      <main className="contenedor">
        {empresa?.estado === "aprobada" && (
          <p className="aviso aviso--exito" role="status">
            Tu empresa fue aprobada. Tus ofertas aprobadas se muestran a los
            estudiantes.
          </p>
        )}

        {empresa?.estado === "pendiente" && (
          <p className="aviso aviso--info" role="status">
            Tu empresa está pendiente de validación por la coordinación. Puedes
            registrar ofertas, pero solo se publicarán cuando tu empresa y la
            oferta sean aprobadas.
          </p>
        )}

        {empresa?.estado === "rechazada" && (
          <p className="aviso error" role="alert">
            La coordinación rechazó el registro de tu empresa
            {empresa.motivoRechazo ? `: ${empresa.motivoRechazo}` : "."} Comunícate
            con la coordinación de prácticas.
          </p>
        )}

        <section aria-labelledby="titulo-publicar" id="publicar">
          <h2 id="titulo-publicar" className="titulo-seccion">
            Publicar una oferta
          </h2>

          <form className="formulario-oferta" onSubmit={enviar}>
            <label className="campo campo--ancho">
              Título del puesto
              <input
                name="titulo"
                value={datos.titulo}
                onChange={cambiar}
                required
                minLength={5}
                maxLength={200}
                placeholder="Ej.: Practicante de desarrollo web"
              />
            </label>

            <label className="campo campo--ancho">
              Descripción y funciones
              <textarea
                name="descripcion"
                value={datos.descripcion}
                onChange={cambiar}
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                placeholder="Describe las actividades, herramientas y lo que aprenderá el practicante."
              />
              <small>{datos.descripcion.length}/2000</small>
            </label>

            <label className="campo">
              Carrera
              <input
                name="carrera"
                value={datos.carrera}
                onChange={cambiar}
                required
                minLength={3}
                maxLength={150}
                list="lista-carreras"
                placeholder="Ej.: Ingeniería de Sistemas"
              />
              <datalist id="lista-carreras">
                {carreras.map((carrera) => (
                  <option key={carrera} value={carrera} />
                ))}
              </datalist>
            </label>

            <label className="campo">
              Modalidad
              <select name="modalidad" value={datos.modalidad} onChange={cambiar}>
                {MODALIDADES.map(({ valor, etiqueta }) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              Ciclo mínimo
              <select
                name="ciclo_minimo"
                value={datos.ciclo_minimo}
                onChange={cambiar}
              >
                {CICLOS.map((ciclo) => (
                  <option key={ciclo} value={ciclo}>
                    {ciclo}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              Créditos mínimos
              <input
                type="number"
                name="creditos_minimos"
                value={datos.creditos_minimos}
                onChange={cambiar}
                required
                min={0}
                max={250}
              />
            </label>

            <label className="campo">
              Vacantes
              <input
                type="number"
                name="vacantes"
                value={datos.vacantes}
                onChange={cambiar}
                required
                min={1}
                max={100}
              />
            </label>

            <label className="campo">
              Fecha límite de postulación
              <input
                type="date"
                name="fecha_limite"
                value={datos.fecha_limite}
                onChange={cambiar}
                required
                min={manana()}
              />
            </label>

            {errorEnvio && (
              <p className="aviso error campo--ancho" role="alert">
                {errorEnvio}
              </p>
            )}

            {exito && (
              <p className="aviso aviso--exito campo--ancho" role="status">
                {exito}
              </p>
            )}

            <div className="campo--ancho">
              <button type="submit" disabled={enviando}>
                {enviando ? "Enviando…" : "Enviar para revisión"}
              </button>
            </div>
          </form>
        </section>

        <section aria-labelledby="titulo-mias" id="mis-ofertas">
          <h2 id="titulo-mias" className="titulo-seccion">
            Mis ofertas
          </h2>

          {errorCarga && (
            <div className="aviso error" role="alert">
              <p>{errorCarga}</p>
              <button onClick={cargar}>Reintentar</button>
            </div>
          )}

          {!panel && !errorCarga && <p role="status">Cargando…</p>}

          {panel && panel.items.length === 0 && (
            <p className="aviso">Todavía no has publicado ofertas.</p>
          )}

          {panel && panel.items.length > 0 && (
            <div className="listado">
              {panel.items.map((oferta) => {
                const estado = ESTADOS[oferta.estado] ?? {
                  texto: oferta.estado,
                  clase: ""
                };

                return (
                  <article className="tarjeta" key={oferta.id}>
                    <span className={`etiqueta ${estado.clase}`}>
                      {estado.texto}
                    </span>

                    <h3>{oferta.titulo}</h3>

                    {oferta.estado === "rechazada" && oferta.motivoRechazo && (
                      <p className="aviso error">
                        Motivo del rechazo: {oferta.motivoRechazo}
                      </p>
                    )}

                    {oferta.estado === "cerrada" && oferta.motivoCierre && (
                      <p className="aviso aviso--info">
                        Cerrada por la coordinación: {oferta.motivoCierre}
                      </p>
                    )}

                    <p>{oferta.descripcion}</p>

                    <dl className="detalles">
                      <div>
                        <dt>Carrera</dt>
                        <dd>{oferta.carrera}</dd>
                      </div>
                      <div>
                        <dt>Modalidad</dt>
                        <dd>
                          {MODALIDADES.find((m) => m.valor === oferta.modalidad)
                            ?.etiqueta ?? oferta.modalidad}
                        </dd>
                      </div>
                      <div>
                        <dt>Ciclo mínimo</dt>
                        <dd>{oferta.ciclo_minimo}</dd>
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

                    {["publicada", "cerrada"].includes(oferta.estado) && (
                      <Postulantes oferta={oferta} token={token} alCambiarOferta={cargar} />
                    )}

                    {["publicada", "pendiente_revision"].includes(oferta.estado) && (
                      <CerrarOferta alCerrar={cerrar(oferta.id)} />
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
