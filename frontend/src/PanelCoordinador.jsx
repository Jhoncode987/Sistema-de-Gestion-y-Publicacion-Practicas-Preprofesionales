import { useCallback, useEffect, useState } from "react";
import ListadoOfertas from "./ListadoOfertas.jsx";
import PostulacionesCoordinacion from "./PostulacionesCoordinacion.jsx";
import { MODALIDADES, formatearFecha, formatearFechaHora } from "./formato.js";

const URL_API = import.meta.env.VITE_API_URL ?? "";

async function pedir(ruta, token, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${URL_API}/api/v1/coordinacion${ruta}`, {
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

// Botones Aprobar / Rechazar. Rechazar pide el motivo, que verá la empresa.
// Con soloCierre muestra un único botón «Cerrar oferta» (oferta ya publicada).
function Decision({ alDecidir, puedeAprobar = true, soloCierre = false }) {
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function decidir(accion) {
    setEnviando(true);
    setError("");

    try {
      await alDecidir(accion, motivo);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="decision">
      {rechazando ? (
        <>
          <label className="campo">
            {soloCierre
              ? "Motivo del cierre (lo verá la empresa)"
              : "Motivo del rechazo (lo verá la empresa)"}
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              minLength={5}
              maxLength={500}
              autoFocus
            />
          </label>
          <div className="decision__botones">
            <button
              type="button"
              className="boton-peligro"
              disabled={enviando || motivo.trim().length < 5}
              onClick={() => decidir(soloCierre ? "cerrar" : "rechazar")}
            >
              {soloCierre ? "Confirmar cierre" : "Confirmar rechazo"}
            </button>
            <button
              type="button"
              className="boton-secundario"
              disabled={enviando}
              onClick={() => setRechazando(false)}
            >
              Cancelar
            </button>
          </div>
        </>
      ) : soloCierre ? (
        <div className="decision__botones">
          <button
            type="button"
            className="boton-secundario"
            onClick={() => setRechazando(true)}
          >
            Cerrar oferta
          </button>
        </div>
      ) : (
        <div className="decision__botones">
          <button
            type="button"
            disabled={enviando || !puedeAprobar}
            onClick={() => decidir("aprobar")}
          >
            Aprobar
          </button>
          <button
            type="button"
            className="boton-secundario"
            disabled={enviando}
            onClick={() => setRechazando(true)}
          >
            Rechazar
          </button>
        </div>
      )}

      {error && (
        <p className="aviso error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function PanelCoordinador({ token, alExpirar }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [claveRecarga, setClaveRecarga] = useState(0);

  const cargar = useCallback(async () => {
    try {
      setDatos(await pedir("/pendientes", token));
      setError("");
    } catch (err) {
      if (err.estado === 401) {
        return alExpirar();
      }

      setError(err.message);
    }
  }, [token, alExpirar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Tras decidir se vuelve a consultar: si otro coordinador ya decidió, la
  // lista se actualiza sola y el error del servidor explica qué pasó.
  function decidir(tipo, id) {
    return async (accion, motivo) => {
      try {
        await pedir(`/${tipo}/${id}/${accion}`, token, {
          method: "POST",
          body: JSON.stringify({ motivo })
        });
      } catch (err) {
        if (err.estado === 401) {
          return alExpirar();
        }

        await cargar();
        throw err;
      }

      await cargar();
    };
  }

  // Cierra una oferta publicada: deja de verse, pero se conserva su historial.
  function cerrar(id) {
    return async (_accion, motivo) => {
      try {
        await pedir(`/ofertas/${id}/cerrar`, token, {
          method: "POST",
          body: JSON.stringify({ motivo })
        });
      } catch (err) {
        if (err.estado === 401) {
          return alExpirar();
        }

        setClaveRecarga((n) => n + 1);
        throw err;
      }

      setClaveRecarga((n) => n + 1);
    };
  }

  return (
    <>
      <section className="hero hero--panel" id="inicio">
        <div className="hero__interior">
          <p className="hero__etiqueta">Coordinación de prácticas</p>
          <h1>Validación de empresas y ofertas</h1>
          <p className="hero__texto">
            Revisa los registros pendientes. Una oferta solo se publica si su
            empresa ya fue aprobada.
          </p>
        </div>
      </section>

      <main className="contenedor">
        {error && (
          <div className="aviso error" role="alert">
            <p>{error}</p>
            <button onClick={cargar}>Reintentar</button>
          </div>
        )}

        {!datos && !error && <p role="status">Cargando…</p>}

        {datos && (
          <>
            <section aria-labelledby="titulo-empresas" id="empresas">
              <h2 id="titulo-empresas" className="titulo-seccion">
                Empresas por validar ({datos.empresas.length})
              </h2>

              {datos.empresas.length === 0 ? (
                <p className="aviso">No hay empresas pendientes.</p>
              ) : (
                <div className="listado">
                  {datos.empresas.map((empresa) => (
                    <article className="tarjeta" key={empresa.id}>
                      <span className="etiqueta estado--revision">Pendiente</span>
                      <h3>{empresa.razonSocial}</h3>
                      <dl className="detalles">
                        <div>
                          <dt>RUC</dt>
                          <dd>{empresa.ruc}</dd>
                        </div>
                        <div>
                          <dt>Registrada</dt>
                          <dd>{formatearFechaHora(empresa.creadaEn)}</dd>
                        </div>
                        <div>
                          <dt>Ofertas enviadas</dt>
                          <dd>{empresa.totalOfertas}</dd>
                        </div>
                      </dl>
                      <p className="filtros__ayuda">
                        Compara el RUC y la razón social con la consulta
                        oficial de SUNAT antes de aprobar.
                      </p>
                      <Decision alDecidir={decidir("empresas", empresa.id)} />
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="titulo-ofertas-rev" id="ofertas-revision">
              <h2 id="titulo-ofertas-rev" className="titulo-seccion">
                Ofertas por revisar ({datos.ofertas.length})
              </h2>

              {datos.ofertas.length === 0 ? (
                <p className="aviso">No hay ofertas pendientes.</p>
              ) : (
                <div className="listado">
                  {datos.ofertas.map((oferta) => (
                    <article className="tarjeta" key={oferta.id}>
                      <span className="etiqueta estado--revision">En revisión</span>
                      <h3>{oferta.titulo}</h3>
                      <p className="empresa">{oferta.empresa}</p>

                      {oferta.empresaEstado !== "aprobada" && (
                        <p className="aviso aviso--info">
                          Su empresa aún no está aprobada
                          {oferta.empresaEstado === "rechazada"
                            ? " (fue rechazada)"
                            : ": apruébala primero"}
                          . Solo podrás rechazar esta oferta.
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

                      <Decision
                        alDecidir={decidir("ofertas", oferta.id)}
                        puedeAprobar={oferta.empresaEstado === "aprobada"}
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <ListadoOfertas
          token={token}
          alExpirar={alExpirar}
          idSeccion="publicadas"
          titulo="Ofertas publicadas"
          claveRecarga={claveRecarga}
          acciones={(oferta) => (
            <Decision alDecidir={cerrar(oferta.id)} soloCierre />
          )}
        />

        <PostulacionesCoordinacion token={token} alExpirar={alExpirar} />
      </main>
    </>
  );
}
