import { useCallback, useEffect, useState } from "react";

const URL_API = import.meta.env.VITE_API_URL ?? "";
const CLAVE_TOKEN = "unsch_token";

// sessionStorage puede fallar (modo privado, políticas del navegador): se ignora.
function leerToken() {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

function guardarToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(CLAVE_TOKEN, token);
    } else {
      sessionStorage.removeItem(CLAVE_TOKEN);
    }
  } catch {
    // Sin almacenamiento la sesión dura hasta recargar la página.
  }
}

async function pedir(ruta, { metodo = "GET", cuerpo, token } = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${URL_API}/api/v1/auth${ruta}`, {
      method: metodo,
      headers: {
        ...(cuerpo ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
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

export function useSesion() {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(leerToken);
  const [restaurando, setRestaurando] = useState(Boolean(leerToken()));

  // Al abrir la página, recupera al usuario si todavía hay un token válido.
  useEffect(() => {
    const guardado = leerToken();

    if (!guardado) {
      return;
    }

    let activo = true;

    pedir("/yo", { token: guardado })
      .then((datos) => activo && setUsuario(datos.usuario))
      .catch((error) => {
        // Solo se descarta el token si el servidor lo rechazó.
        if (activo && error.estado === 401) {
          guardarToken(null);
          setToken(null);
        }
      })
      .finally(() => activo && setRestaurando(false));

    return () => {
      activo = false;
    };
  }, []);

  const establecer = useCallback((datos) => {
    guardarToken(datos.token);
    setToken(datos.token);
    setUsuario(datos.usuario);
  }, []);

  const iniciarSesion = useCallback(
    async (correo, clave) => establecer(await pedir("/login", { metodo: "POST", cuerpo: { correo, clave } })),
    [establecer]
  );

  const registrar = useCallback(
    async (datos) => establecer(await pedir("/registro", { metodo: "POST", cuerpo: datos })),
    [establecer]
  );

  const cerrarSesion = useCallback(() => {
    guardarToken(null);
    setToken(null);
    setUsuario(null);
  }, []);

  return { usuario, token, restaurando, iniciarSesion, registrar, cerrarSesion };
}
