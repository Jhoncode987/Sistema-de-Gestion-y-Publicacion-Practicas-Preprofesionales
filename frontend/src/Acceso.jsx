import { useState } from "react";

const CAMPOS_REGISTRO = {
  rol: "estudiante",
  nombre: "",
  correo: "",
  clave: "",
  codigoEstudiante: "",
  ruc: "",
  razonSocial: ""
};

export default function Acceso({ sesion, alTerminar }) {
  const [modo, setModo] = useState("ingresar");
  const [datos, setDatos] = useState(CAMPOS_REGISTRO);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setDatos((anterior) => ({ ...anterior, [name]: value }));
  }

  function cambiarModo(nuevo) {
    setModo(nuevo);
    setError("");
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    setEnviando(true);

    try {
      if (modo === "ingresar") {
        await sesion.iniciarSesion(datos.correo, datos.clave);
      } else {
        const { rol, nombre, correo, clave } = datos;
        await sesion.registrar(
          rol === "estudiante"
            ? { rol, nombre, correo, clave, codigoEstudiante: datos.codigoEstudiante }
            : { rol, nombre, correo, clave, ruc: datos.ruc, razonSocial: datos.razonSocial }
        );
      }

      alTerminar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const registrando = modo === "registrarse";

  return (
    <section className="acceso" id="acceso" aria-labelledby="titulo-acceso">
      <div className="acceso__tarjeta">
        <div className="acceso__pestanas" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!registrando}
            onClick={() => cambiarModo("ingresar")}
          >
            Ingresar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={registrando}
            onClick={() => cambiarModo("registrarse")}
          >
            Crear cuenta
          </button>
        </div>

        <h2 id="titulo-acceso">
          {registrando ? "Crear cuenta" : "Ingresar al portal"}
        </h2>

        <form onSubmit={enviar} className="acceso__formulario">
          {registrando && (
            <>
              <label className="campo">
                Soy
                <select name="rol" value={datos.rol} onChange={cambiar}>
                  <option value="estudiante">Estudiante</option>
                  <option value="empresa">Empresa</option>
                </select>
              </label>

              <label className="campo">
                {datos.rol === "empresa" ? "Nombre del contacto" : "Nombre completo"}
                <input
                  name="nombre"
                  value={datos.nombre}
                  onChange={cambiar}
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                />
              </label>

              {datos.rol === "estudiante" ? (
                <label className="campo">
                  Código de estudiante
                  <input
                    name="codigoEstudiante"
                    value={datos.codigoEstudiante}
                    onChange={cambiar}
                    required
                    inputMode="numeric"
                    pattern="\d{6,10}"
                    title="Entre 6 y 10 dígitos"
                  />
                </label>
              ) : (
                <>
                  <label className="campo">
                    RUC
                    <input
                      name="ruc"
                      value={datos.ruc}
                      onChange={cambiar}
                      required
                      inputMode="numeric"
                      pattern="\d{11}"
                      title="11 dígitos"
                    />
                  </label>
                  <label className="campo">
                    Razón social
                    <input
                      name="razonSocial"
                      value={datos.razonSocial}
                      onChange={cambiar}
                      required
                      minLength={2}
                      maxLength={150}
                    />
                  </label>
                </>
              )}
            </>
          )}

          <label className="campo">
            Correo electrónico
            <input
              type="email"
              name="correo"
              value={datos.correo}
              onChange={cambiar}
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>

          <label className="campo">
            Contraseña
            <input
              type="password"
              name="clave"
              value={datos.clave}
              onChange={cambiar}
              required
              minLength={registrando ? 8 : undefined}
              maxLength={128}
              autoComplete={registrando ? "new-password" : "current-password"}
            />
            {registrando && <small>Mínimo 8 caracteres.</small>}
          </label>

          {error && (
            <p className="aviso error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={enviando}>
            {enviando ? "Enviando…" : registrando ? "Crear cuenta" : "Ingresar"}
          </button>
        </form>

        {registrando && datos.rol === "empresa" && (
          <p className="filtros__ayuda">
            Las empresas deben ser validadas por la coordinación antes de
            publicar ofertas.
          </p>
        )}
      </div>
    </section>
  );
}
