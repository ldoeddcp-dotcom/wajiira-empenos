'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const fmtM = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const parseM = (v: string) => Number(v.replace(/\./g, ''))

type Subasta = { id_subasta: number; fecha_evento: string; precio_venta_final: string; id_bien: number; id_comprador: number; estado_articulo?: string }
type BienOpt = { id_bien: number; label: string; imagen_url?: string; descripcion: string; valor_avaluo: number }
type CompradorOpt = { id_comprador: number; label: string }

const ESTADOS_ARTICULO = ['Excelente', 'Bueno', 'Regular', 'Deteriorado']

export default function Subastas() {
  const [subastas, setSubastas]       = useState<Subasta[]>([])
  const [bienesMora, setBienesMora]   = useState<BienOpt[]>([])
  const [compradores, setCompradores] = useState<CompradorOpt[]>([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(false)
  const [modalComp, setModalComp]     = useState(false)
  const [form, setForm]               = useState({ fecha_evento: '', precio_venta_final: '', id_bien: '', id_comprador: '', estado_articulo: '' })
  const [formComp, setFormComp]       = useState({ documento: '', nombres_apellidos: '', telefono: '', correo: '', id_tipo_doc: '' })
  const [tiposDoc, setTiposDoc]       = useState<{id_tima: number; tima_nombre: string}[]>([])
  const [error, setError]             = useState('')

  const bienSeleccionado = bienesMora.find(b => String(b.id_bien) === form.id_bien) || null

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('tbl_subastas').select('*').order('id_subasta')
    setSubastas(data || [])
    setLoading(false)
  }

  async function cargarBienesMora() {
    const { data: idMora } = await supabase.from('tbl_tipos_maestra').select('id_tima').in('tima_codigo', ['EST_MORA', 'EST_SUBASTA'])
    const ids = (idMora || []).map((x: any) => x.id_tima)
    const { data: prestamos } = await supabase.from('tbl_prestamo').select('id_bien').in('id_tipo_estado', ids)
    const bienIds = (prestamos || []).map((p: any) => p.id_bien)
    if (bienIds.length === 0) { setBienesMora([]); return }
    const { data: bienes } = await supabase.from('tbl_bienes').select('id_bien, descripcion, imagen_url, valor_avaluo').in('id_bien', bienIds)
    setBienesMora((bienes || []).map((b: any) => ({
      id_bien: b.id_bien,
      label: `#${b.id_bien} - ${b.descripcion}`,
      descripcion: b.descripcion,
      imagen_url: b.imagen_url,
      valor_avaluo: b.valor_avaluo,
    })))
  }

  useEffect(() => {
    cargar()
    cargarBienesMora()
    supabase.from('tbl_compradores').select('id_comprador, tbl_personas(documento, nombres_apellidos)')
      .then(r => setCompradores((r.data || []).map((c: any) => ({
        id_comprador: c.id_comprador,
        label: `${c.tbl_personas.documento} - ${c.tbl_personas.nombres_apellidos}`
      }))))
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').eq('is_tabla', 1).then(r => setTiposDoc(r.data || []))
  }, [])

  async function guardarSubasta() {
    setError('')
    if (!form.fecha_evento || !form.precio_venta_final || !form.id_bien || !form.id_comprador || !form.estado_articulo) {
      setError('Todos los campos son obligatorios.'); return
    }
    const { error: e } = await supabase.from('tbl_subastas').insert({
      fecha_evento: form.fecha_evento,
      precio_venta_final: parseM(form.precio_venta_final),
      id_bien: Number(form.id_bien),
      id_comprador: Number(form.id_comprador),
      estado_articulo: form.estado_articulo,
    })
    if (e) { setError(e.message); return }
    setModal(false)
    cargar()
    cargarBienesMora()
    alert('Subasta registrada. Trigger cambio estado prestamo a Vendido.')
  }

  async function guardarComprador() {
    setError('')
    if (!formComp.documento || !formComp.nombres_apellidos || !formComp.telefono || !formComp.correo || !formComp.id_tipo_doc) {
      setError('Todos los campos son obligatorios.'); return
    }
    const { data: persona, error: e1 } = await supabase.from('tbl_personas').insert({
      documento: formComp.documento,
      nombres_apellidos: formComp.nombres_apellidos,
      telefono: formComp.telefono,
      correo: formComp.correo,
      id_tipo_doc: Number(formComp.id_tipo_doc)
    }).select().single()
    if (e1) { setError(e1.message); return }
    const { error: e2 } = await supabase.from('tbl_compradores').insert({ id_persona: persona.id_persona })
    if (e2) { setError(e2.message); return }
    setModalComp(false)
    const { data: comps } = await supabase.from('tbl_compradores').select('id_comprador, tbl_personas(documento, nombres_apellidos)')
    setCompradores((comps || []).map((c: any) => ({ id_comprador: c.id_comprador, label: `${c.tbl_personas.documento} - ${c.tbl_personas.nombres_apellidos}` })))
  }

  const estadoColor: Record<string, string> = {
    'Excelente': 'bg-green-100 text-green-700',
    'Bueno':     'bg-blue-100 text-blue-700',
    'Regular':   'bg-amber-100 text-amber-700',
    'Deteriorado':'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Subastas</h2>
        <div className="flex gap-2">
          <button onClick={() => { setFormComp({ documento: '', nombres_apellidos: '', telefono: '', correo: '', id_tipo_doc: '' }); setError(''); setModalComp(true) }}
            className="border border-teal-700 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-50">
            + Comprador
          </button>
          <button onClick={() => { setForm({ fecha_evento: '', precio_venta_final: '', id_bien: '', id_comprador: '', estado_articulo: '' }); setError(''); setModal(true) }}
            className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-600">
            + Nueva Subasta
          </button>
        </div>
      </div>

      {bienesMora.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-700">
          {bienesMora.length} bien(es) disponible(s) para subasta (en mora).
        </div>
      )}

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Articulo</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Comprador</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-right">Precio Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subastas.map(s => (
                <tr key={s.id_subasta} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{s.id_subasta}</td>
                  <td className="px-4 py-3">Bien #{s.id_bien}</td>
                  <td className="px-4 py-3">
                    {s.estado_articulo
                      ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[s.estado_articulo] || 'bg-gray-100 text-gray-600'}`}>{s.estado_articulo}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">Comprador #{s.id_comprador}</td>
                  <td className="px-4 py-3">{s.fecha_evento}</td>
                  <td className="px-4 py-3 text-right font-medium">${Number(s.precio_venta_final).toLocaleString()}</td>
                </tr>
              ))}
              {subastas.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin subastas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva subasta */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Nueva Subasta</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">

              {/* Selector de bien */}
              <select value={form.id_bien} onChange={e => setForm({...form, id_bien: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Bien en mora</option>
                {bienesMora.map(b => <option key={b.id_bien} value={b.id_bien}>{b.label}</option>)}
              </select>

              {/* Preview del bien seleccionado */}
              {bienSeleccionado && (
                <div className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {bienSeleccionado.imagen_url
                    ? <img src={bienSeleccionado.imagen_url} alt={bienSeleccionado.descripcion}
                        className="w-20 h-20 rounded-lg object-cover border flex-shrink-0" />
                    : <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                  }
                  <div className="flex flex-col justify-center">
                    <p className="font-semibold text-gray-800 text-sm">{bienSeleccionado.descripcion}</p>
                    <p className="text-xs text-gray-500 mt-1">Avaluo: <span className="text-teal-700 font-medium">${bienSeleccionado.valor_avaluo?.toLocaleString()}</span></p>
                    <p className="text-xs text-amber-600 mt-0.5">En mora — disponible para subasta</p>
                  </div>
                </div>
              )}

              {/* Estado del artículo */}
              <select value={form.estado_articulo} onChange={e => setForm({...form, estado_articulo: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Estado del articulo</option>
                {ESTADOS_ARTICULO.map(e => <option key={e} value={e}>{e}</option>)}
              </select>

              <select value={form.id_comprador} onChange={e => setForm({...form, id_comprador: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Seleccionar comprador</option>
                {compradores.map(c => <option key={c.id_comprador} value={c.id_comprador}>{c.label}</option>)}
              </select>

              <input type="date" value={form.fecha_evento} onChange={e => setForm({...form, fecha_evento: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />

              <input inputMode="numeric" placeholder="Precio venta final" value={form.precio_venta_final} onChange={e => setForm({...form, precio_venta_final: fmtM(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={guardarSubasta} className="flex-1 bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600">Registrar</button>
              <button onClick={() => setModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo comprador */}
      {modalComp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Nuevo Comprador</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <input placeholder="Documento" value={formComp.documento} onChange={e => setFormComp({...formComp, documento: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input placeholder="Nombres y apellidos" value={formComp.nombres_apellidos} onChange={e => setFormComp({...formComp, nombres_apellidos: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input placeholder="Telefono" value={formComp.telefono} onChange={e => setFormComp({...formComp, telefono: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input placeholder="Correo" value={formComp.correo} onChange={e => setFormComp({...formComp, correo: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <select value={formComp.id_tipo_doc} onChange={e => setFormComp({...formComp, id_tipo_doc: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Tipo documento</option>
                {tiposDoc.map(t => <option key={t.id_tima} value={t.id_tima}>{t.tima_nombre}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={guardarComprador} className="flex-1 bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600">Guardar</button>
              <button onClick={() => setModalComp(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
