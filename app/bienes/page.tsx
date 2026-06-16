'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const fmtM = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const parseM = (v: string) => Number(v.replace(/\./g, ''))

type Bien = {
  id_bien: number
  descripcion: string
  valor_comercial: number
  valor_avaluo: number
  id_cliente: number
  id_tipo_categoria: number
  imagen_url?: string
}
type Catalogo = { id_tima: number; tima_nombre: string }
type ClienteOpt = { id_cliente: number; label: string }

function ImgPlaceholder() {
  return (
    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  )
}

export default function Bienes() {
  const [bienes, setBienes]       = useState<Bien[]>([])
  const [categorias, setCategorias] = useState<Catalogo[]>([])
  const [clientes, setClientes]   = useState<ClienteOpt[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [editando, setEditando]   = useState<Bien | null>(null)
  const [form, setForm]           = useState({ descripcion: '', valor_comercial: '', valor_avaluo: '', id_cliente: '', id_tipo_categoria: '' })
  const [imgFile, setImgFile]     = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [subiendo, setSubiendo]   = useState(false)
  const [error, setError]         = useState('')
  const [visor, setVisor]         = useState<Bien | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('tbl_bienes').select('*').order('id_bien')
    setBienes(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').eq('is_tabla', 2)
      .then(r => setCategorias(r.data || []))
    supabase.from('tbl_cliente').select('id_cliente, tbl_personas(documento, nombres_apellidos)')
      .then(r => setClientes((r.data || []).map((c: any) => ({
        id_cliente: c.id_cliente,
        label: `${c.tbl_personas.documento} - ${c.tbl_personas.nombres_apellidos}`
      }))))
  }, [])

  function abrirNuevo() {
    setEditando(null)
    setForm({ descripcion: '', valor_comercial: '', valor_avaluo: '', id_cliente: '', id_tipo_categoria: '' })
    setImgFile(null); setImgPreview(null)
    setError(''); setModal(true)
  }

  function abrirEditar(b: Bien) {
    setEditando(b)
    setForm({
      descripcion: b.descripcion,
      valor_comercial: String(b.valor_comercial),
      valor_avaluo: String(b.valor_avaluo),
      id_cliente: String(b.id_cliente),
      id_tipo_categoria: String(b.id_tipo_categoria)
    })
    setImgFile(null)
    setImgPreview(b.imagen_url || null)
    setError(''); setModal(true)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setImgFile(f)
    const reader = new FileReader()
    reader.onload = ev => setImgPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function subirImagen(): Promise<string | null> {
    if (!imgFile) return editando?.imagen_url || null
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = ev => resolve(ev.target?.result as string)
      reader.readAsDataURL(imgFile)
    })
  }

  async function guardar() {
    setError('')
    if (!form.descripcion || !form.valor_comercial || !form.valor_avaluo || !form.id_cliente || !form.id_tipo_categoria) {
      setError('Todos los campos son obligatorios.'); return
    }
    const imagen_url = await subirImagen()
    const payload: any = {
      descripcion: form.descripcion,
      valor_comercial: parseM(form.valor_comercial),
      valor_avaluo: parseM(form.valor_avaluo),
      id_cliente: Number(form.id_cliente),
      id_tipo_categoria: Number(form.id_tipo_categoria),
      ...(imagen_url !== null && { imagen_url })
    }
    const { error: e } = editando
      ? await supabase.from('tbl_bienes').update(payload).eq('id_bien', editando.id_bien)
      : await supabase.from('tbl_bienes').insert(payload)
    if (e) { setError(e.message); return }
    setModal(false)
    cargar()
  }

  async function eliminar(b: Bien) {
    if (!confirm(`Eliminar bien "${b.descripcion}"?`)) return
    const { error: e } = await supabase.from('tbl_bienes').delete().eq('id_bien', b.id_bien)
    if (e) { alert(e.message); return }
    cargar()
  }

  const catNombre = (id: number) => categorias.find(c => c.id_tima === id)?.tima_nombre || id
  const cliNombre = (id: number) => clientes.find(c => c.id_cliente === id)?.label || id

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Bienes</h2>
        <button onClick={abrirNuevo} className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-600">
          + Nuevo Bien
        </button>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Foto</th>
                <th className="px-4 py-3 text-left">Descripcion</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-right">Valor Comercial</th>
                <th className="px-4 py-3 text-right">Valor Avaluo</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bienes.map(b => (
                <tr key={b.id_bien} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {b.imagen_url
                      ? <img src={b.imagen_url} alt={b.descripcion}
                          onClick={() => setVisor(b)}
                          className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:scale-105 transition-transform border" />
                      : <ImgPlaceholder />
                    }
                  </td>
                  <td className="px-4 py-3 font-medium">{b.descripcion}</td>
                  <td className="px-4 py-3">{catNombre(b.id_tipo_categoria)}</td>
                  <td className="px-4 py-3 text-xs">{cliNombre(b.id_cliente)}</td>
                  <td className="px-4 py-3 text-right">${b.valor_comercial?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">${b.valor_avaluo?.toLocaleString()}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => abrirEditar(b)} className="text-teal-700 hover:underline">Editar</button>
                    <button onClick={() => eliminar(b)} className="text-red-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
              {bienes.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin bienes registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editando ? 'Editar Bien' : 'Nuevo Bien'}</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">

              {/* Imagen */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Foto del bien</label>
                <div className="flex items-center gap-3">
                  {imgPreview
                    ? <img src={imgPreview} className="w-20 h-20 rounded-xl object-cover border" alt="preview" />
                    : <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                  }
                  <div>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="text-sm text-teal-700 border border-teal-300 px-3 py-1.5 rounded-lg hover:bg-teal-50">
                      {imgPreview ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                    {imgPreview && (
                      <button type="button" onClick={() => { setImgFile(null); setImgPreview(null) }}
                        className="block text-xs text-gray-400 hover:text-red-500 mt-1">
                        Quitar foto
                      </button>
                    )}
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                </div>
              </div>

              <input placeholder="Descripcion del bien" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input inputMode="numeric" placeholder="Valor comercial" value={form.valor_comercial} onChange={e => setForm({...form, valor_comercial: fmtM(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input inputMode="numeric" placeholder="Valor avaluo" value={form.valor_avaluo} onChange={e => setForm({...form, valor_avaluo: fmtM(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <select value={form.id_cliente} onChange={e => setForm({...form, id_cliente: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Seleccionar cliente</option>
                {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.label}</option>)}
              </select>
              <select value={form.id_tipo_categoria} onChange={e => setForm({...form, id_tipo_categoria: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Categoria del bien</option>
                {categorias.map(c => <option key={c.id_tima} value={c.id_tima}>{c.tima_nombre}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={guardar} disabled={subiendo}
                className="flex-1 bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50">
                Guardar
              </button>
              <button onClick={() => setModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Visor imagen grande */}
      {visor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setVisor(null)}>
          <div className="max-w-2xl w-full p-4" onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <img src={visor.imagen_url!} alt={visor.descripcion} className="w-full object-contain max-h-[70vh]" />
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{visor.descripcion}</p>
                  <p className="text-sm text-gray-500">{catNombre(visor.id_tipo_categoria)} · Avaluo: ${visor.valor_avaluo?.toLocaleString()}</p>
                </div>
                <button onClick={() => setVisor(null)} className="text-gray-400 hover:text-gray-700 text-sm">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
