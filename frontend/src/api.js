// Cliente mínimo para la API con el token de sesión.
// En desarrollo VITE_API_URL queda vacío y Vite redirige /api al backend.
const URL_API = import.meta.env.VITE_API_URL ?? "";

// `archivo` envía un archivo tal cual (por ejemplo un PDF) en vez de JSON.
export async function pedirApi(ruta, token, { metodo = "GET", cuerpo, archivo } = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${URL_API}/api/v1${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(cuerpo ? { "Content-Type": "application/json" } : {}),
        ...(archivo ? { "Content-Type": archivo.type || "application/octet-stream" } : {})
      },
      body: archivo ?? (cuerpo ? JSON.stringify(cuerpo) : undefined)
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

// Descarga un archivo protegido (con el token) y lo abre en otra pestaña.
export async function abrirPdf(ruta, token) {
  let respuesta;

  try {
    respuesta = await fetch(`${URL_API}/api/v1${ruta}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    const error = new Error(datos?.mensaje ?? "No se pudo abrir el archivo.");
    error.estado = respuesta.status;
    throw error;
  }

  const url = URL.createObjectURL(await respuesta.blob());
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
