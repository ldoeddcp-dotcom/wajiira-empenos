'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Opt = { value: number; label: string }
type Resultado = { ok: boolean; mensaje: string; detalle?: string }

function Badge({ texto }: { texto: string }) {
  return <span className="bg-teal-100 text-teal-800 text-xs font-mono px-2 py-1 rounded">{texto}</span>
}

function ResultBox({ res }: { res: Resultado | null }) {
  if (!res) return null
  return (
    <div className={`mt-3 p-3 rounded-lg text-sm ${res.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
      <p className="font-medium">{res.ok ? '✓' : '✗'} {res.mensaje}</p>
      {res.detalle && <p className="text-xs mt-1 opacity-80">{res.detalle}</p>}
    </div>
  )
}

/* ────────── Proceso 1 ────────── */
function Proceso1() {
  const [clientes, setClientes] = useState<Opt[]>([])
  const [categorias, setCategorias] = useState<Opt[]>([])
  const [form, setForm] = useState({ id_cliente: '', id_tipo_categoria: '', descripcion: '', valor_comercial: '', valor_avaluo: '' })
  const [res, setRes] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('tbl_cliente').select('id_cliente, tbl_personas(documento, nombres_apellidos)')
      .then(r => setClientes((r.data || []).map((c: any) => ({ value: c.id_cliente, label: `${c.tbl_personas.documento} - ${c.tbl_personas.nombres_apellidos}` }))))
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').eq('is_tabla', 2)
      .then(r => setCategorias((r.data || []).map((c: any) => ({ value: c.id_tima, label: c.tima_nombre }))))
  }, [])

  async function ejecutar() {
    setLoading(true); setRes(null)
    const payload = {
      descripcion: form.descripcion,
      valor_comercial: Number(form.valor_comercial),
      valor_avaluo: Number(form.valor_avaluo),
      id_cliente: Number(form.id_cliente),
      id_tipo_categoria: Number(form.id_tipo_categoria)
    }
    const { error } = await supabase.from('tbl_bienes').insert(payload)
    if (error) { setRes({ ok: false, mensaje: error.message }); setLoading(false); return }
    const { data: cli } = await supabase.from('tbl_cliente')
      .select('id_nivel_riesgo, tbl_tipos_maestra(tima_nombre)').eq('id_cliente', Number(form.id_cliente)).single()
    const riesgo = (cli as any)?.tbl_tipos_maestra?.tima_nombre || '?'
    setRes({ ok: true, mensaje: 'Bien registrado. Trigger ejecutado.', detalle: `Nivel de riesgo actualizado → ${riesgo}` })
    setLoading(false)
  }

  return (
    <div className="space-y-3 mt-4">
      <select value={form.id_cliente} onChange={e => setForm({...form, id_cliente: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Seleccionar cliente</option>
        {clientes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <select value={form.id_tipo_categoria} onChange={e => setForm({...form, id_tipo_categoria: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Categoria del bien</option>
        {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <input placeholder="Descripcion del bien" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Valor comercial" value={form.valor_comercial} onChange={e => setForm({...form, valor_comercial: e.target.value})}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input type="number" placeholder="Valor avaluo" value={form.valor_avaluo} onChange={e => setForm({...form, valor_avaluo: e.target.value})}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>
      <button onClick={ejecutar} disabled={loading}
        className="w-full bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm">
        {loading ? 'Ejecutando...' : 'Registrar Bien y Evaluar Riesgo'}
      </button>
      <ResultBox res={res} />
    </div>
  )
}

/* ────────── Proceso 2 ────────── */
function Proceso2() {
  const [bienes, setBienes] = useState<Opt[]>([])
  const [form, setForm] = useState({ id_bien: '', monto_aprobado: '', plazo_meses: '' })
  const [res, setRes] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('tbl_bienes').select('id_bien, descripcion')
      .then(r => setBienes((r.data || []).map((b: any) => ({ value: b.id_bien, label: `#${b.id_bien} - ${b.descripcion}` }))))
  }, [])

  async function ejecutar() {
    setLoading(true); setRes(null)
    const { data, error } = await supabase.from('tbl_prestamo').insert({
      id_bien: Number(form.id_bien),
      monto_aprobado: Number(form.monto_aprobado),
      plazo_meses: form.plazo_meses,
      id_tipo_estado: null
    }).select().single()
    if (error) { setRes({ ok: false, mensaje: error.message }); setLoading(false); return }
    setRes({ ok: true, mensaje: 'Préstamo creado. Trigger ejecutado.', detalle: `Tasa asignada: ${data.tasa_interes}% — Estado: Pendiente Aprobación` })
    setLoading(false)
  }

  return (
    <div className="space-y-3 mt-4">
      <select value={form.id_bien} onChange={e => setForm({...form, id_bien: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Seleccionar bien</option>
        {bienes.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="Monto aprobado" value={form.monto_aprobado} onChange={e => setForm({...form, monto_aprobado: e.target.value})}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input type="number" placeholder="Plazo (meses)" value={form.plazo_meses} onChange={e => setForm({...form, plazo_meses: e.target.value})}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>
      <button onClick={ejecutar} disabled={loading}
        className="w-full bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm">
        {loading ? 'Ejecutando...' : 'Aprobar Préstamo'}
      </button>
      <ResultBox res={res} />
    </div>
  )
}

/* ────────── Proceso 3 ────────── */
function Proceso3() {
  const [prestamos, setPrestamos] = useState<Opt[]>([])
  const [form, setForm] = useState({ id_prestamo: '', fecha_inicio: '', ubicacion_bien: '' })
  const [res, setRes] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('tbl_prestamo').select('id_prestamo, monto_aprobado, id_tipo_estado')
      .then(async r => {
        const { data: est } = await supabase.from('tbl_tipos_maestra').select('id_tima').eq('tima_codigo', 'EST_PENDIENTE').single()
        const pendientes = (r.data || []).filter((p: any) => p.id_tipo_estado === est?.id_tima)
        setPrestamos(pendientes.map((p: any) => ({ value: p.id_prestamo, label: `#${p.id_prestamo} - $${Number(p.monto_aprobado).toLocaleString()}` })))
      })
  }, [])

  async function ejecutar() {
    setLoading(true); setRes(null)
    const p = prestamos.find(x => x.value === Number(form.id_prestamo))
    const fechaVenc = new Date(form.fecha_inicio)
    fechaVenc.setMonth(fechaVenc.getMonth() + 1)
    const { data, error } = await supabase.from('tbl_contratos').insert({
      id_prestamo: Number(form.id_prestamo),
      fecha_inicio: form.fecha_inicio,
      fecha_vencimiento: fechaVenc.toISOString().split('T')[0],
      ubicacion_bien: form.ubicacion_bien
    }).select().single()
    if (error) { setRes({ ok: false, mensaje: error.message }); setLoading(false); return }
    const { data: desembolso } = await supabase.from('tbl_desembolsos').select('monto_entrega').eq('id_contrato', data.id_contrato).single()
    setRes({ ok: true, mensaje: 'Contrato creado. Trigger ejecutado.', detalle: `Desembolso generado automáticamente: $${Number(desembolso?.monto_entrega).toLocaleString()} — Préstamo → Activo` })
    setLoading(false)
  }

  return (
    <div className="space-y-3 mt-4">
      <select value={form.id_prestamo} onChange={e => setForm({...form, id_prestamo: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Préstamo en Pendiente Aprobación</option>
        {prestamos.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input placeholder="Ubicacion del bien (bodega, local, etc)" value={form.ubicacion_bien} onChange={e => setForm({...form, ubicacion_bien: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm" />
      <button onClick={ejecutar} disabled={loading}
        className="w-full bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm">
        {loading ? 'Ejecutando...' : 'Generar Contrato y Desembolso'}
      </button>
      <ResultBox res={res} />
    </div>
  )
}

/* ────────── Proceso 4 ────────── */
function Proceso4() {
  const [prestamos, setPrestamos] = useState<Opt[]>([])
  const [tiposPago, setTiposPago] = useState<Opt[]>([])
  const [medios, setMedios] = useState<Opt[]>([])
  const [form, setForm] = useState({ id_prestamo: '', monto_pagado: '', id_tipo_pago: '', id_tipo_medio_pago: '' })
  const [res, setRes] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').in('tima_codigo', ['EST_ACTIVO', 'EST_MORA'])
      .then(async r => {
        const ids = (r.data || []).map((x: any) => x.id_tima)
        const { data } = await supabase.from('tbl_prestamo').select('id_prestamo,monto_aprobado').in('id_tipo_estado', ids)
        setPrestamos((data || []).map((p: any) => ({ value: p.id_prestamo, label: `#${p.id_prestamo} - $${Number(p.monto_aprobado).toLocaleString()}` })))
      })
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').eq('is_tabla', 5)
      .then(r => setTiposPago((r.data || []).map((x: any) => ({ value: x.id_tima, label: x.tima_nombre }))))
    supabase.from('tbl_tipos_maestra').select('id_tima,tima_nombre').eq('is_tabla', 6)
      .then(r => setMedios((r.data || []).map((x: any) => ({ value: x.id_tima, label: x.tima_nombre }))))
  }, [])

  async function ejecutar() {
    setLoading(true); setRes(null)
    const { error } = await supabase.from('tbl_pago').insert({
      id_prestamo: Number(form.id_prestamo),
      fecha_pago: new Date().toISOString().split('T')[0],
      monto_pagado: Number(form.monto_pagado),
      id_tipo_pago: Number(form.id_tipo_pago),
      id_tipo_medio_pago: Number(form.id_tipo_medio_pago)
    })
    if (error) { setRes({ ok: false, mensaje: error.message }); setLoading(false); return }
    const { data: p } = await supabase.from('tbl_prestamo').select('monto_aprobado, id_tipo_estado, tbl_tipos_maestra(tima_nombre)').eq('id_prestamo', Number(form.id_prestamo)).single()
    const { data: pagos } = await supabase.from('tbl_pago').select('monto_pagado').eq('id_prestamo', Number(form.id_prestamo))
    const totalPagado = (pagos || []).reduce((a: number, x: any) => a + Number(x.monto_pagado), 0)
    const saldo = Number((p as any)?.monto_aprobado) - totalPagado
    const estado = (p as any)?.tbl_tipos_maestra?.tima_nombre
    setRes({ ok: true, mensaje: 'Pago registrado. Trigger ejecutado.', detalle: `Saldo pendiente: $${saldo.toLocaleString()} — Estado préstamo: ${estado}` })
    setLoading(false)
  }

  return (
    <div className="space-y-3 mt-4">
      <select value={form.id_prestamo} onChange={e => setForm({...form, id_prestamo: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Préstamo Activo / En Mora</option>
        {prestamos.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <input type="number" placeholder="Monto a pagar" value={form.monto_pagado} onChange={e => setForm({...form, monto_pagado: e.target.value})}
        className="w-full border rounded-lg px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <select value={form.id_tipo_pago} onChange={e => setForm({...form, id_tipo_pago: e.target.value})}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tipo pago</option>
          {tiposPago.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={form.id_tipo_medio_pago} onChange={e => setForm({...form, id_tipo_medio_pago: e.target.value})}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Medio</option>
          {medios.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <button onClick={ejecutar} disabled={loading}
        className="w-full bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm">
        {loading ? 'Ejecutando...' : 'Registrar Pago'}
      </button>
      <ResultBox res={res} />
    </div>
  )
}

/* ────────── Proceso 5 ────────── */
function Proceso5() {
  const [res, setRes] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)

  async function ejecutar() {
    setLoading(true); setRes(null)
    const hoy = new Date().toISOString().split('T')[0]
    const { data: idActivo } = await supabase.from('tbl_tipos_maestra').select('id_tima').eq('tima_codigo', 'EST_ACTIVO').single()
    const { data: idMora }   = await supabase.from('tbl_tipos_maestra').select('id_tima').eq('tima_codigo', 'EST_MORA').single()
    const { data: contratos } = await supabase.from('tbl_contratos').select('id_prestamo').lt('fecha_vencimiento', hoy)
    const ids = (contratos || []).map((c: any) => c.id_prestamo)
    if (ids.length === 0) {
      setRes({ ok: true, mensaje: 'No hay préstamos vencidos activos para marcar en mora.' })
      setLoading(false); return
    }
    const { error, count } = await supabase.from('tbl_prestamo')
      .update({ id_tipo_estado: idMora?.id_tima })
      .in('id_prestamo', ids)
      .eq('id_tipo_estado', idActivo?.id_tima)
    if (error) { setRes({ ok: false, mensaje: error.message }); setLoading(false); return }
    setRes({ ok: true, mensaje: 'Proceso ejecutado correctamente.', detalle: `Préstamos actualizados a "En Mora". Trigger TRG_PRESTAMO_MORA bloquea cambios en estados finales (Pagado/Vendido).` })
    setLoading(false)
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-500 mb-3">Detecta préstamos con contrato vencido en estado Activo y los mueve a "En Mora". El trigger bloquea modificaciones en préstamos Pagados o Vendidos.</p>
      <button onClick={ejecutar} disabled={loading}
        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-500 disabled:opacity-50 text-sm">
        {loading ? 'Ejecutando...' : 'Ejecutar Actualización de Mora'}
      </button>
      <ResultBox res={res} />
    </div>
  )
}

/* ────────── Proceso 6 ────────── */
function Proceso6() {
  const [bienes, setBienes] = useState<Opt[]>([])
  const [compradores, setCompradores] = useState<Opt[]>([])
  const [form, setForm] = useState({ id_bien: '', id_comprador: '', precio_venta_final: '' })
  const [res, setRes] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('tbl_tipos_maestra').select('id_tima').in('tima_codigo', ['EST_MORA','EST_SUBASTA'])
      .then(async r => {
        const ids = (r.data || []).map((x: any) => x.id_tima)
        const { data: prest } = await supabase.from('tbl_prestamo').select('id_bien').in('id_tipo_estado', ids)
        const bienIds = (prest || []).map((p: any) => p.id_bien)
        if (bienIds.length === 0) { setBienes([]); return }
        const { data } = await supabase.from('tbl_bienes').select('id_bien, descripcion').in('id_bien', bienIds)
        setBienes((data || []).map((b: any) => ({ value: b.id_bien, label: `#${b.id_bien} - ${b.descripcion}` })))
      })
    supabase.from('tbl_compradores').select('id_comprador, tbl_personas(documento, nombres_apellidos)')
      .then(r => setCompradores((r.data || []).map((c: any) => ({ value: c.id_comprador, label: `${c.tbl_personas.documento} - ${c.tbl_personas.nombres_apellidos}` }))))
  }, [])

  async function ejecutar() {
    setLoading(true); setRes(null)
    const { error } = await supabase.from('tbl_subastas').insert({
      id_bien: Number(form.id_bien),
      id_comprador: Number(form.id_comprador),
      fecha_evento: new Date().toISOString().split('T')[0],
      precio_venta_final: form.precio_venta_final
    })
    if (error) { setRes({ ok: false, mensaje: error.message }); setLoading(false); return }
    setRes({ ok: true, mensaje: 'Subasta registrada. Trigger ejecutado.', detalle: 'Estado del préstamo actualizado automáticamente a "Vendido" por TRG_SUBASTA_CIERRE.' })
    setLoading(false)
  }

  return (
    <div className="space-y-3 mt-4">
      {bienes.length === 0
        ? <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">No hay bienes en mora disponibles para subastar. Ejecuta primero el Proceso 5.</p>
        : <>
          <select value={form.id_bien} onChange={e => setForm({...form, id_bien: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Bien en mora</option>
            {bienes.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          <select value={form.id_comprador} onChange={e => setForm({...form, id_comprador: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Seleccionar comprador</option>
            {compradores.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input type="number" placeholder="Precio venta final" value={form.precio_venta_final} onChange={e => setForm({...form, precio_venta_final: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <button onClick={ejecutar} disabled={loading}
            className="w-full bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm">
            {loading ? 'Ejecutando...' : 'Registrar Subasta'}
          </button>
        </>
      }
      <ResultBox res={res} />
    </div>
  )
}

/* ────────── PÁGINA PRINCIPAL ────────── */
const PROCESOS = [
  {
    numero: 1, nombre: 'Análisis de Riesgo y Evaluación de Bienes',
    trigger: 'fn_bienes_eval_riesgo', tabla: 'tbl_bienes (BEFORE INSERT OR UPDATE)',
    reglas: ['valor_avaluo ≤ valor_comercial', 'Suma > 5M → Riesgo Alto', 'Suma > 1M → Riesgo Medio', 'Suma ≤ 1M → Riesgo Bajo'],
    Componente: Proceso1,
  },
  {
    numero: 2, nombre: 'Aprobación y Estructuración del Préstamo',
    trigger: 'fn_prestamo_aprobacion', tabla: 'tbl_prestamo (BEFORE INSERT)',
    reglas: ['monto ≤ 70% del avalúo', 'Riesgo Alto → 5%', 'Riesgo Medio → 3.5%', 'Riesgo Bajo → 2%'],
    Componente: Proceso2,
  },
  {
    numero: 3, nombre: 'Desembolso y Formalización Contractual',
    trigger: 'fn_contrato_desembolso', tabla: 'tbl_contratos (AFTER INSERT)',
    reglas: ['Auto-inserta en tbl_desembolsos', 'Estado préstamo → Activo'],
    Componente: Proceso3,
  },
  {
    numero: 4, nombre: 'Administración y Seguimiento del Préstamo',
    trigger: 'fn_pago_seguimiento', tabla: 'tbl_pago (AFTER INSERT)',
    reglas: ['Recalcula saldo', 'Saldo ≤ 0 → Estado Pagado'],
    Componente: Proceso4,
  },
  {
    numero: 5, nombre: 'Gestión de Incumplimiento y Recuperación',
    trigger: 'fn_prestamo_mora', tabla: 'tbl_prestamo (BEFORE UPDATE OF id_tipo_estado)',
    reglas: ['Bloquea cambios en Pagado/Vendido', 'Vencidos Activos → En Mora'],
    Componente: Proceso5,
  },
  {
    numero: 6, nombre: 'Comercialización y Subasta de Bienes',
    trigger: 'fn_subasta_cierre', tabla: 'tbl_subastas (AFTER INSERT)',
    reglas: ['Auto-cambia estado préstamo → Vendido'],
    Componente: Proceso6,
  },
]

export default function Procesos() {
  const [abierto, setAbierto] = useState<number | null>(null)

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2 text-gray-800">Procesos de Negocio</h2>
      <p className="text-gray-500 mb-6 text-sm">6 procesos con triggers PL/pgSQL — haz clic en cada uno para ejecutarlo</p>

      <div className="space-y-4">
        {PROCESOS.map(({ numero, nombre, trigger, tabla, reglas, Componente }) => (
          <div key={numero} className="bg-white rounded-2xl shadow overflow-hidden">
            <button
              onClick={() => setAbierto(abierto === numero ? null : numero)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-teal-700 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                {numero}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{nombre}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge texto={trigger + '()'} />
                  <span className="text-xs text-gray-400">{tabla}</span>
                </div>
              </div>
              <span className="text-gray-400 text-xl">{abierto === numero ? '▲' : '▼'}</span>
            </button>

            {abierto === numero && (
              <div className="border-t px-5 pb-5">
                <div className="flex flex-wrap gap-2 mt-4 mb-4">
                  {reglas.map(r => (
                    <span key={r} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">✓ {r}</span>
                  ))}
                </div>
                <Componente />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
