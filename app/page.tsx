import { supabase } from '@/lib/supabase'

export default async function Dashboard() {
  const [{ count: clientes }, { count: activos }, { count: mora }, { count: subastas }] =
    await Promise.all([
      supabase.from('tbl_cliente').select('*', { count: 'exact', head: true }),
      supabase.from('tbl_prestamo').select('*', { count: 'exact', head: true }).eq('id_tipo_estado', 12),
      supabase.from('tbl_prestamo').select('*', { count: 'exact', head: true }).eq('id_tipo_estado', 14),
      supabase.from('tbl_subastas').select('*', { count: 'exact', head: true }),
    ])

  const kpis = [
    {
      label: 'Total Clientes',
      value: clientes ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      accent: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Préstamos Activos',
      value: activos ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'from-emerald-500 to-teal-600',
      light: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'En Mora',
      value: mora ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'from-red-500 to-rose-600',
      light: 'bg-red-50 text-red-600',
    },
    {
      label: 'Subastas',
      value: subastas ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      ),
      accent: 'from-violet-500 to-purple-600',
      light: 'bg-violet-50 text-violet-600',
    },
  ]

  return (
    <div>
      {/* Hero header */}
      <div className="relative rounded-3xl overflow-hidden mb-10 p-8"
        style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #115e59 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute -bottom-12 -left-8 w-64 h-64 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)' }}>
            <svg viewBox="0 0 56 56" className="w-10 h-10" fill="none">
              <circle cx="28" cy="12" r="7" fill="white" opacity="0.95"/>
              <circle cx="16" cy="30" r="7" fill="white" opacity="0.85"/>
              <circle cx="40" cy="30" r="7" fill="white" opacity="0.85"/>
              <rect x="12" y="40" width="32" height="5" rx="2.5" fill="white" opacity="0.6"/>
              <circle cx="25.5" cy="9.5" r="2" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Wajiira Empeños</h1>
            <p className="text-teal-200 text-sm mt-1">Sistema de Gestión · Casa de Empeño · La Guajira, Colombia</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4 mb-10">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.light}`}>
              {k.icon}
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </div>
            <div className={`h-1 rounded-full bg-gradient-to-r ${k.accent} opacity-70`} />
          </div>
        ))}
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p className="text-xs text-teal-600 font-semibold uppercase tracking-widest mb-2">Módulos del sistema</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 text-sm text-gray-600">
          {['Clientes', 'Bienes', 'Préstamos', 'Contratos', 'Pagos', 'Mora', 'Subastas'].map(m => (
            <div key={m} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              {m}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
