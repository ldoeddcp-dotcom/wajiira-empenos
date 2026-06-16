export default function Acerca() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Acerca del Proyecto</h2>
      <div className="bg-white rounded-2xl shadow p-8 space-y-6">
        <section>
          <h3 className="text-xl font-semibold text-teal-700 mb-2">Objetivo</h3>
          <p className="text-gray-600">
            Sistema web para la gestión integral de una casa de empeño: registro de clientes,
            evaluación de bienes, aprobación de préstamos, seguimiento de pagos,
            control de mora y comercialización mediante subastas.
          </p>
        </section>
        <section>
          <h3 className="text-xl font-semibold text-teal-700 mb-2">Integrantes</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Integrante 1 — Proceso 1 y 2 (Riesgo y Préstamos)</li>
            <li>Integrante 2 — Proceso 3 y 4 (Contratos y Pagos)</li>
            <li>Integrante 3 — Proceso 5 y 6 (Mora y Subastas)</li>
          </ul>
        </section>
        <section>
          <h3 className="text-xl font-semibold text-teal-700 mb-2">Tecnologías</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Base de datos: PostgreSQL (Supabase) — modelo 4FN</li>
            <li>Frontend: Next.js 15 + Tailwind CSS</li>
            <li>Deploy: Vercel</li>
            <li>6 triggers PL/pgSQL para procesos de negocio</li>
          </ul>
        </section>
        <section>
          <h3 className="text-xl font-semibold text-teal-700 mb-2">Modelo de datos</h3>
          <p className="text-gray-600">
            10 tablas normalizadas en 4FN: TBL_TIPOS_MAESTRA, TBL_PERSONAS, TBL_CLIENTE,
            TBL_COMPRADORES, TBL_BIENES, TBL_PRESTAMO, TBL_CONTRATOS, TBL_DESEMBOLSOS,
            TBL_PAGO, TBL_SUBASTAS.
          </p>
        </section>
      </div>
    </div>
  )
}
