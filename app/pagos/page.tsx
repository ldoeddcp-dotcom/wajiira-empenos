'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const fmtM = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const parseM = (v: string) => Number(v.replace(/\./g, ''))

type Pago = { id_pago: number; fecha_pago: string; monto_pagado: number; id_prestamo: number; id_tipo_pago: number; id_tipo_medio_pago: number }
type Catalogo = { id_tima: number; tima_nombre: string }
type PrestamoOpt = { id_prestamo: number; label: string; monto_aprobado: number }

export default function Pagos() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [tiposPago, setTiposPago] = useState<Catalogo[]>([])
  const [mediosPago, setMediosPago] = useState<Catalogo[]>([])
  const [prestamos, setPrestamos] = useState<PrestamoOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saldo, setSaldo] = useState<number | null>(null)
  const [form, setForm] = useState({ fecha_pago: '', monto_pagado: '', id_prestamo: '', id_tipo_pago: '', id_tipo_medio_pago: '' })
  const [error, setError] = useState('')

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('tbl_pago').select('*').order('id_pago')
    setPagos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').eq('is_tabla', 5).then(r => setTiposPago(r.data || []))
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').eq('is_tabla', 6).then(r => setMediosPago(r.data || []))
    supabase.from('tbl_prestamo').select('id_prestamo, monto_aprobado, id_tipo_estado')
      .in('id_tipo_estado', [12, 14])
      .then(r => setPrestamos((r.data || []).map((p: any) => ({
        id_prestamo: p.id_prestamo,
        monto_aprobado: p.monto_aprobado,
        label: `Prestamo #${p.id_prestamo} — $${p.monto_aprobado?.toLocaleString()}`
      }))))
  }, [])

  async function calcularSaldo(idPrestamo: number) {
    const p = prestamos.find(x => x.id_prestamo === idPrestamo)
    if (!p) return
    const { data } = await supabase.from('tbl_pago').select('monto_pagado').eq('id_prestamo', idPrestamo)
    const totalPagado = (data || []).reduce((acc: number, x: any) => acc + Number(x.monto_pagado), 0)
    setSaldo(p.monto_aprobado - totalPagado)
  }

  async function guardar() {
    setError('')
    if (!form.fecha_pago || !form.monto_pagado || !form.id_prestamo || !form.id_tipo_pago || !form.id_tipo_medio_pago) {
      setError('Todos los campos son obligatorios.'); return
    }
    const { error: e } = await supabase.from('tbl_pago').insert({
      fecha_pago: form.fecha_pago,
      monto_pagado: parseM(form.monto_pagado),
      id_prestamo: Number(form.id_prestamo),
      id_tipo_pago: Number(form.id_tipo_pago),
      id_tipo_medio_pago: Number(form.id_tipo_medio_pago)
    })
    if (e) { setError(e.message); return }
    setModal(false)
    cargar()
  }

  const tipoPagoNombre = (id: number) => tiposPago.find(t => t.id_tima === id)?.tima_nombre || id
  const medioNombre = (id: number) => mediosPago.find(t => t.id_tima === id)?.tima_nombre || id

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Pagos</h2>
        <button onClick={() => { setForm({ fecha_pago: '', monto_pagado: '', id_prestamo: '', id_tipo_pago: '', id_tipo_medio_pago: '' }); setSaldo(null); setError(''); setModal(true) }}
          className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-600">
          + Registrar Pago
        </button>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Prestamo</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-left">Tipo Pago</th>
                <th className="px-4 py-3 text-left">Medio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagos.map(p => (
                <tr key={p.id_pago} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{p.id_pago}</td>
                  <td className="px-4 py-3">#{p.id_prestamo}</td>
                  <td className="px-4 py-3">{p.fecha_pago}</td>
                  <td className="px-4 py-3 text-right font-medium">${Number(p.monto_pagado).toLocaleString()}</td>
                  <td className="px-4 py-3">{tipoPagoNombre(p.id_tipo_pago)}</td>
                  <td className="px-4 py-3">{medioNombre(p.id_tipo_medio_pago)}</td>
                </tr>
              ))}
              {pagos.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin pagos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Registrar Pago</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            {saldo !== null && (
              <div className={`mb-3 p-3 rounded-lg text-sm font-medium ${saldo <= 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                Saldo pendiente: ${saldo.toLocaleString()}
              </div>
            )}
            <div className="space-y-3">
              <select value={form.id_prestamo} onChange={e => {
                setForm({...form, id_prestamo: e.target.value})
                if (e.target.value) calcularSaldo(Number(e.target.value))
                else setSaldo(null)
              }} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Seleccionar prestamo (Activo/Mora)</option>
                {prestamos.map(p => <option key={p.id_prestamo} value={p.id_prestamo}>{p.label}</option>)}
              </select>
              <input type="date" value={form.fecha_pago} onChange={e => setForm({...form, fecha_pago: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input inputMode="numeric" placeholder="Monto a pagar" value={form.monto_pagado} onChange={e => setForm({...form, monto_pagado: fmtM(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <select value={form.id_tipo_pago} onChange={e => setForm({...form, id_tipo_pago: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Tipo de pago</option>
                {tiposPago.map(t => <option key={t.id_tima} value={t.id_tima}>{t.tima_nombre}</option>)}
              </select>
              <select value={form.id_tipo_medio_pago} onChange={e => setForm({...form, id_tipo_medio_pago: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Medio de pago</option>
                {mediosPago.map(t => <option key={t.id_tima} value={t.id_tima}>{t.tima_nombre}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={guardar} className="flex-1 bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600">Guardar</button>
              <button onClick={() => setModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
