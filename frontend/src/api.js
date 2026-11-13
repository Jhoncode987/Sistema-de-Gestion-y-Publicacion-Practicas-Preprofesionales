// Cliente mínimo para la API con el token de sesión.
// En desarrollo VITE_API_URL queda vacío y Vite redirige /api al backend.
const URL_API = import.meta.env.VITE_API_URL ?? "";

export async function pedirApi(ruta, token, { metodo = "GET", cuerpo } = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${URL_API}/api/v1${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(cuerpo ? { "Content-Type": "application/json" } : {})
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
    error.codigo = datos?.codigo;
    error.motivos = datos?.motivos ?? [];
    throw error;
  }

  return datos;
}
