'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id_cliente: number
  id_nivel_riesgo: number
  tbl_personas: {
    id_persona: number
    documento: string
    nombres_apellidos: string
    telefono: string
    correo: string
    id_tipo_doc: number
  }
}

type Catalogo = { id_tima: number; tima_nombre: string }

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tiposDoc, setTiposDoc] = useState<Catalogo[]>([])
  const [niveles, setNiveles] = useState<Catalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [form, setForm] = useState({
    documento: '', nombres_apellidos: '', telefono: '', correo: '',
    id_tipo_doc: '', id_nivel_riesgo: ''
  })
  const [error, setError] = useState('')

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('tbl_cliente')
      .select('id_cliente, id_nivel_riesgo, tbl_personas(id_persona, documento, nombres_apellidos, telefono, correo, id_tipo_doc)')
      .order('id_cliente')
    setClientes((data as unknown as Cliente[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').eq('is_tabla', 1).then(r => setTiposDoc(r.data || []))
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').eq('is_tabla', 3).then(r => setNiveles(r.data || []))
  }, [])

  function abrirNuevo() {
    setEditando(null)
    setForm({ documento: '', nombres_apellidos: '', telefono: '', correo: '', id_tipo_doc: '', id_nivel_riesgo: '' })
    setError('')
    setModal(true)
  }

  function abrirEditar(c: Cliente) {
    setEditando(c)
    setForm({
      documento: c.tbl_personas.documento,
      nombres_apellidos: c.tbl_personas.nombres_apellidos,
      telefono: c.tbl_personas.telefono,
      correo: c.tbl_personas.correo,
      id_tipo_doc: String(c.tbl_personas.id_tipo_doc),
      id_nivel_riesgo: String(c.id_nivel_riesgo)
    })
    setError('')
    setModal(true)
  }

  async function guardar() {
    setError('')
    if (!form.documento || !form.nombres_apellidos || !form.telefono || !form.correo || !form.id_tipo_doc || !form.id_nivel_riesgo) {
      setError('Todos los campos son obligatorios.')
      return
    }
    if (editando) {
      const { error: e1 } = await supabase.from('tbl_personas').update({
        documento: form.documento,
        nombres_apellidos: form.nombres_apellidos,
        telefono: form.telefono,
        correo: form.correo,
        id_tipo_doc: Number(form.id_tipo_doc)
      }).eq('id_persona', editando.tbl_personas.id_persona)
      const { error: e2 } = await supabase.from('tbl_cliente').update({
        id_nivel_riesgo: Number(form.id_nivel_riesgo)
      }).eq('id_cliente', editando.id_cliente)
      if (e1 || e2) { setError(e1?.message || e2?.message || 'Error'); return }
    } else {
      const { data: persona, error: e1 } = await supabase.from('tbl_personas').insert({
        documento: form.documento,
        nombres_apellidos: form.nombres_apellidos,
        telefono: form.telefono,
        correo: form.correo,
        id_tipo_doc: Number(form.id_tipo_doc)
      }).select().single()
      if (e1) { setError(e1.message); return }
      const { error: e2 } = await supabase.from('tbl_cliente').insert({
        id_persona: persona.id_persona,
        id_nivel_riesgo: Number(form.id_nivel_riesgo)
      })
      if (e2) { setError(e2.message); return }
    }
    setModal(false)
    cargar()
  }

  async function eliminar(c: Cliente) {
    if (!confirm(`Eliminar cliente ${c.tbl_personas.nombres_apellidos} y todos sus bienes, préstamos y contratos?`)) return
    const { error } = await supabase.rpc('eliminar_cliente_completo', { p_id_cliente: c.id_cliente })
    if (error) { alert(error.message); return }
    cargar()
  }

  const nivelNombre = (id: number) => niveles.find(n => n.id_tima === id)?.tima_nombre || id
  const docNombre = (id: number) => tiposDoc.find(t => t.id_tima === id)?.tima_nombre || id

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Clientes</h2>
        <button onClick={abrirNuevo} className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-600">
          + Nuevo Cliente
        </button>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo Doc</th>
                <th className="px-4 py-3 text-left">Telefono</th>
                <th className="px-4 py-3 text-left">Correo</th>
                <th className="px-4 py-3 text-left">Nivel Riesgo</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map(c => (
                <tr key={c.id_cliente} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{c.tbl_personas.documento}</td>
                  <td className="px-4 py-3 font-medium">{c.tbl_personas.nombres_apellidos}</td>
                  <td className="px-4 py-3">{docNombre(c.tbl_personas.id_tipo_doc)}</td>
                  <td className="px-4 py-3">{c.tbl_personas.telefono}</td>
                  <td className="px-4 py-3">{c.tbl_personas.correo}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      String(nivelNombre(c.id_nivel_riesgo)).includes('Alto') ? 'bg-red-100 text-red-700' :
                      String(nivelNombre(c.id_nivel_riesgo)).includes('Medio') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>{nivelNombre(c.id_nivel_riesgo)}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => abrirEditar(c)} className="text-teal-700 hover:underline">Editar</button>
                    <button onClick={() => eliminar(c)} className="text-red-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin clientes registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editando ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <input placeholder="Documento" value={form.documento} onChange={e => setForm({...form, documento: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input placeholder="Nombres y apellidos" value={form.nombres_apellidos} onChange={e => setForm({...form, nombres_apellidos: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input placeholder="Telefono" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input placeholder="Correo" value={form.correo} onChange={e => setForm({...form, correo: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <select value={form.id_tipo_doc} onChange={e => setForm({...form, id_tipo_doc: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Tipo de documento</option>
                {tiposDoc.map(t => <option key={t.id_tima} value={t.id_tima}>{t.tima_nombre}</option>)}
              </select>
              <select value={form.id_nivel_riesgo} onChange={e => setForm({...form, id_nivel_riesgo: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Nivel de riesgo</option>
                {niveles.map(n => <option key={n.id_tima} value={n.id_tima}>{n.tima_nombre}</option>)}
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
