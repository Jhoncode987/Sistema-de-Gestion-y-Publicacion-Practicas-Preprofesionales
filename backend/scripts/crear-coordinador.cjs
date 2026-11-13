// Crea una cuenta de coordinador (no se puede registrar desde la web).
// Uso (PowerShell):
//   $env:COORDINADOR_CLAVE="una-clave-segura"
//   node scripts/crear-coordinador.cjs correo@unsch.edu.pe "Nombre Apellido"
require("dotenv").config({ path: require("node:path").join(__dirname, "..", ".env") });

const { Pool } = require("pg");
const { crearUsuariosRepository } = require("../src/modules/identidad/infraestructura/usuarios.repository.cjs");
const { crearCrearCoordinador } = require("../src/modules/identidad/aplicacion/registrar-usuario.cjs");

async function principal() {
  const [correo, nombre] = process.argv.slice(2);
  const clave = process.env.COORDINADOR_CLAVE;

  if (!correo || !nombre || !clave) {
    console.error('Uso: COORDINADOR_CLAVE definida y node scripts/crear-coordinador.cjs <correo> "<nombre>"');
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL || undefined });

  try {
    const crear = crearCrearCoordinador({
      usuariosRepository: crearUsuariosRepository(pool)
    });
    const usuario = await crear({ correo, nombre, clave });

    console.log(`Coordinador creado: ${usuario.correo}`);
  } catch (error) {
    console.error(`No se pudo crear el coordinador: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

principal();
