'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  {
    href: '/', label: 'Inicio',
    icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: '/clientes', label: 'Clientes',
    icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: '/bienes', label: 'Bienes',
    icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    href: '/prestamos', label: 'Préstamos',
    icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    href: '/firma', label: 'Contratos',
    icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    href: '/pagos', label: 'Pagos',
    icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    href: '/mora', label: 'Mora',
    icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    href: '/subastas', label: 'Subastas',
    icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>,
  },
]

export default function Sidebar() {
  const [open, setOpen] = useState(true)
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar */}
      <aside
        className="bg-teal-700 text-white flex flex-col min-h-screen fixed top-0 left-0 z-40 transition-all duration-300"
        style={{ width: open ? '224px' : '64px' }}
      >
        {/* Toggle button */}
        <button
          onClick={() => setOpen(o => !o)}
          className="absolute -right-3 top-6 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center shadow-md hover:bg-teal-500 transition-colors z-50"
        >
          <svg className={`w-3 h-3 text-white transition-transform duration-300 ${open ? '' : 'rotate-180'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Logo */}
        <div className={`flex flex-col items-center gap-2 px-3 py-6 border-b border-teal-600 overflow-hidden`}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
            <svg viewBox="0 0 56 56" className="w-10 h-10" fill="none">
              <circle cx="28" cy="12" r="7" fill="white" opacity="0.95"/>
              <circle cx="16" cy="30" r="7" fill="white" opacity="0.85"/>
              <circle cx="40" cy="30" r="7" fill="white" opacity="0.85"/>
              <rect x="12" y="40" width="32" height="5" rx="2.5" fill="white" opacity="0.6"/>
              <circle cx="25.5" cy="9.5" r="2" fill="white" opacity="0.5"/>
            </svg>
          </div>
          {open && (
            <div className="text-center transition-opacity duration-200">
              <p className="font-bold text-base leading-tight tracking-wide whitespace-nowrap">Wajiira Empeños</p>
              <p className="text-teal-300 text-xs tracking-widest uppercase mt-0.5">Casa de Empeño</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-2 flex-1 mt-1">
          {nav.map(n => {
            const active = pathname === n.href
            return (
              <Link key={n.href} href={n.href}
                title={!open ? n.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  active ? 'bg-white/20 font-semibold' : 'hover:bg-teal-600'
                }`}
              >
                <span className={`opacity-90 ${active ? 'opacity-100' : ''}`}>{n.icon}</span>
                {open && (
                  <span className="text-sm whitespace-nowrap overflow-hidden transition-opacity duration-200">
                    {n.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Spacer to push main content */}
      <div className="flex-shrink-0 transition-all duration-300" style={{ width: open ? '224px' : '64px' }} />
    </>
  )
}
