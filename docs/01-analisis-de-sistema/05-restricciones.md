# Restricciones del Sistema

| ID | Restricción | Descripción |
|---|---|---|
| **RC01** | Limitaciones Financieras | El sistema no contempla ni gestiona pagos, transacciones monetarias, ni subvenciones económicas asociadas a las prácticas. |
| **RC02** | Independencia del Core | La solución no reemplaza al sistema académico institucional (matrícula, notas, campus virtual); solo se integra con él (ej. SIGA) para consultar datos de elegibilidad del alumno. |
| **RC03** | Ámbito Institucional | El alcance está limitado a gestionar las prácticas de la UNSCH; no incluye la gestión de prácticas fuera de este ámbito ni la evaluación curricular o certificación oficial. |
| **RC04** | Despliegue e Infraestructura | Por el presupuesto académico, el sistema debe ser capaz de desplegarse en infraestructura propia de la universidad o en nubes de nivel académico/gratuito para mitigar costos. |
| **RC05** | Backend monolítico y PostgreSQL | Una aplicación backend con los siete módulos originales y PostgreSQL como única base; sin caché externa, brokers ni microservicios. |
| **RC06** | Referencia funcional Bumeran | Los contenedores de nuestra propuesta y contratos REST corresponden a flujos de candidatos, empresas, avisos y postulaciones; no describen ni consumen una API privada de Bumeran. |

La carga académica se verifica con 20 y 25 usuarios simultáneos. Los avisos base son internos y persisten en PostgreSQL. La ausencia de pagos no elimina necesidades de seguridad o respaldo.
