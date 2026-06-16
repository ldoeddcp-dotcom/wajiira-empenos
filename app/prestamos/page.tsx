'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const fmtM = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const parseM = (v: string) => Number(v.replace(/\./g, ''))

type Prestamo = {
  id_prestamo: number
  monto_aprobado: number
  tasa_interes: number
  plazo_meses: string
  id_bien: number
  id_tipo_estado: number
}
type Catalogo = { id_tima: number; tima_nombre: string }
type BienOpt = { id_bien: number; label: string }

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [estados, setEstados] = useState<Catalogo[]>([])
  const [bienes, setBienes] = useState<BienOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [modalContrato, setModalContrato] = useState(false)
  const [prestamoSel, setPrestamoSel] = useState<Prestamo | null>(null)
  const [form, setForm] = useState({ monto_aprobado: '', plazo_meses: '', id_bien: '' })
  const [formContrato, setFormContrato] = useState({ fecha_inicio: '', ubicacion_bien: '' })
  const [error, setError] = useState('')

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('tbl_prestamo').select('*').order('id_prestamo')
    setPrestamos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').eq('is_tabla', 4).then(r => setEstados(r.data || []))
    supabase.from('tbl_bienes').select('id_bien, descripcion, tbl_cliente(tbl_personas(documento))')
      .then(r => setBienes((r.data || []).map((b: any) => ({
        id_bien: b.id_bien,
        label: `#${b.id_bien} - ${b.descripcion}`
      }))))
  }, [])

  async function guardar() {
    setError('')
    if (!form.monto_aprobado || !form.plazo_meses || !form.id_bien) {
      setError('Todos los campos son obligatorios.'); return
    }
    const { error: e } = await supabase.from('tbl_prestamo').insert({
      monto_aprobado: parseM(form.monto_aprobado),
      plazo_meses: form.plazo_meses,
      id_bien: Number(form.id_bien),
      id_tipo_estado: null
    })
    if (e) { setError(e.message); return }
    setModal(false)
    cargar()
  }

  async function generarContrato() {
    setError('')
    if (!formContrato.fecha_inicio || !formContrato.ubicacion_bien) {
      setError('Todos los campos son obligatorios.'); return
    }
    const fechaVenc = new Date(formContrato.fecha_inicio)
    fechaVenc.setMonth(fechaVenc.getMonth() + Number(prestamoSel?.plazo_meses || 1))
    const { error: e } = await supabase.from('tbl_contratos').insert({
      fecha_inicio: formContrato.fecha_inicio,
      fecha_vencimiento: fechaVenc.toISOString().split('T')[0],
      ubicacion_bien: formContrato.ubicacion_bien,
      id_prestamo: prestamoSel?.id_prestamo
    })
    if (e) { setError(e.message); return }
    setModalContrato(false)
    cargar()
    alert('Contrato generado. Desembolso creado automaticamente por trigger.')
  }

  const estadoNombre = (id: number) => estados.find(e => e.id_tima === id)?.tima_nombre || 'Pendiente'

  function ContratoLink({ idPrestamo }: { idPrestamo: number }) {
    const [idContrato, setIdContrato] = useState<number | null>(null)
    useEffect(() => {
      supabase.from('tbl_contratos').select('id_contrato').eq('id_prestamo', idPrestamo).single()
        .then(({ data }) => { if (data) setIdContrato(data.id_contrato) })
    }, [idPrestamo])
    if (!idContrato) return null
    return (
      <Link href={`/contratos/${idContrato}`} className="text-blue-600 hover:underline text-xs">
        Ver Contrato
      </Link>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Prestamos y Contratos</h2>
        <button onClick={() => { setForm({ monto_aprobado: '', plazo_meses: '', id_bien: '' }); setError(''); setModal(true) }}
          className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-600">
          + Nuevo Prestamo
        </button>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Bien</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Tasa %</th>
                <th className="px-4 py-3 text-left">Plazo</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prestamos.map(p => (
                <tr key={p.id_prestamo} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{p.id_prestamo}</td>
                  <td className="px-4 py-3">Bien #{p.id_bien}</td>
                  <td className="px-4 py-3 text-right font-medium">${p.monto_aprobado?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{p.tasa_interes}%</td>
                  <td className="px-4 py-3">{p.plazo_meses} meses</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      estadoNombre(p.id_tipo_estado).includes('Activo') ? 'bg-green-100 text-green-700' :
                      estadoNombre(p.id_tipo_estado).includes('Mora') ? 'bg-red-100 text-red-700' :
                      estadoNombre(p.id_tipo_estado).includes('Pagado') ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{estadoNombre(p.id_tipo_estado)}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-3 items-center">
                    {estadoNombre(p.id_tipo_estado).includes('Pendiente') && (
                      <button onClick={() => { setPrestamoSel(p); setFormContrato({ fecha_inicio: '', ubicacion_bien: '' }); setError(''); setModalContrato(true) }}
                        className="text-teal-700 hover:underline text-xs">
                        Generar Contrato
                      </button>
                    )}
                    <ContratoLink idPrestamo={p.id_prestamo} />
                  </td>
                </tr>
              ))}
              {prestamos.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin prestamos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Nuevo Prestamo</h3>
            <p className="text-xs text-gray-500 mb-3">El trigger asignara tasa de interes segun nivel de riesgo del cliente.</p>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <select value={form.id_bien} onChange={e => setForm({...form, id_bien: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Seleccionar bien</option>
                {bienes.map(b => <option key={b.id_bien} value={b.id_bien}>{b.label}</option>)}
              </select>
              <input inputMode="numeric" placeholder="Monto aprobado" value={form.monto_aprobado} onChange={e => setForm({...form, monto_aprobado: fmtM(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input type="number" placeholder="Plazo en meses" value={form.plazo_meses} onChange={e => setForm({...form, plazo_meses: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={guardar} className="flex-1 bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600">Guardar</button>
              <button onClick={() => setModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalContrato && prestamoSel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-2">Generar Contrato</h3>
            <p className="text-xs text-gray-500 mb-3">Prestamo #{prestamoSel.id_prestamo} — ${prestamoSel.monto_aprobado?.toLocaleString()}</p>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <label className="block text-xs text-gray-600">Fecha de inicio</label>
              <input type="date" value={formContrato.fecha_inicio} onChange={e => setFormContrato({...formContrato, fecha_inicio: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input placeholder="Ubicacion del bien (bodega/local)" value={formContrato.ubicacion_bien} onChange={e => setFormContrato({...formContrato, ubicacion_bien: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={generarContrato} className="flex-1 bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600">Generar</button>
              <button onClick={() => setModalContrato(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
