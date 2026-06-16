'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ClienteData = {
  id_cliente: number
  nombre: string
  documento: string
  tipo_doc: string
  telefono: string
  correo: string
  nivel_riesgo: string
}
type BienData = {
  id_bien: number
  descripcion: string
  valor_comercial: number
  valor_avaluo: number
  categoria: string
}
type PrestamoData = {
  id_prestamo: number
  monto_aprobado: number
  tasa_interes: number
  plazo_meses: string
}

type Paso = 'seleccion' | 'contrato' | 'firmado'

export default function FirmaContrato() {
  const [paso, setPaso] = useState<Paso>('seleccion')

  // Opciones de selector
  const [clientes, setClientes] = useState<{ id: number; label: string }[]>([])
  const [bienes, setBienes] = useState<BienData[]>([])
  const [prestamos, setPrestamos] = useState<PrestamoData[]>([])

  // Selecciones
  const [idCliente, setIdCliente] = useState('')
  const [idBien, setIdBien] = useState('')
  const [idPrestamo, setIdPrestamo] = useState('')

  // Datos cargados
  const [cliente, setCliente] = useState<ClienteData | null>(null)
  const [bien, setBien] = useState<BienData | null>(null)
  const [prestamo, setPrestamo] = useState<PrestamoData | null>(null)

  // Formulario contrato
  const [fechaInicio, setFechaInicio] = useState('')
  const [ubicacion, setUbicacion] = useState('')

  // Firma
  const [termsScrolled, setTermsScrolled] = useState(false)
  const [acepta, setAcepta] = useState(false)
  const [firmando, setFirmando] = useState(false)
  const [contratoId, setContratoId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const termsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('tbl_cliente')
      .select('id_cliente, tbl_personas(documento, nombres_apellidos)')
      .then(r => setClientes((r.data || []).map((c: any) => ({
        id: c.id_cliente,
        label: `${c.tbl_personas.documento} — ${c.tbl_personas.nombres_apellidos}`
      }))))
  }, [])

  // Al seleccionar cliente → carga datos personales y bienes
  async function onClienteChange(id: string) {
    setIdCliente(id); setIdBien(''); setIdPrestamo('')
    setBienes([]); setPrestamos([])
    setCliente(null); setBien(null); setPrestamo(null)
    if (!id) return

    const { data: cli } = await supabase.from('tbl_cliente')
      .select('id_cliente, id_nivel_riesgo, tbl_personas(documento, nombres_apellidos, telefono, correo, tbl_tipos_maestra(tima_nombre)), tbl_tipos_maestra(tima_nombre)')
      .eq('id_cliente', id).single()

    if (cli) {
      const p = (cli as any).tbl_personas
      setCliente({
        id_cliente: cli.id_cliente,
        nombre: p.nombres_apellidos,
        documento: p.documento,
        tipo_doc: p.tbl_tipos_maestra?.tima_nombre || '',
        telefono: p.telefono,
        correo: p.correo,
        nivel_riesgo: (cli as any).tbl_tipos_maestra?.tima_nombre || ''
      })
    }

    const { data: bs } = await supabase.from('tbl_bienes')
      .select('id_bien, descripcion, valor_comercial, valor_avaluo, tbl_tipos_maestra(tima_nombre)')
      .eq('id_cliente', id)
    setBienes((bs || []).map((b: any) => ({
      id_bien: b.id_bien,
      descripcion: b.descripcion,
      valor_comercial: b.valor_comercial,
      valor_avaluo: b.valor_avaluo,
      categoria: b.tbl_tipos_maestra?.tima_nombre || ''
    })))
  }

  // Al seleccionar bien → carga préstamos pendientes de ese bien
  async function onBienChange(id: string) {
    setIdBien(id); setIdPrestamo(''); setPrestamos([]); setPrestamo(null)
    setBien(bienes.find(b => b.id_bien === Number(id)) || null)
    if (!id) return

    const { data: est } = await supabase.from('tbl_tipos_maestra').select('id_tima').eq('tima_codigo', 'EST_PENDIENTE').single()
    const { data: ps } = await supabase.from('tbl_prestamo')
      .select('id_prestamo, monto_aprobado, tasa_interes, plazo_meses')
      .eq('id_bien', id)
      .eq('id_tipo_estado', est?.id_tima)
    setPrestamos(ps || [])
  }

  // Al seleccionar préstamo
  function onPrestamoChange(id: string) {
    setIdPrestamo(id)
    setPrestamo(prestamos.find(p => p.id_prestamo === Number(id)) || null)
  }

  function handleTermsScroll() {
    const el = termsRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setTermsScrolled(true)
  }

  async function firmar() {
    setError('')
    if (!acepta) { setError('Debes aceptar los términos y condiciones.'); return }
    if (!fechaInicio || !ubicacion) { setError('Completa la fecha y ubicación del bien.'); return }
    setFirmando(true)

    const fechaVenc = new Date(fechaInicio)
    fechaVenc.setMonth(fechaVenc.getMonth() + Number(prestamo?.plazo_meses || 1))

    const { data, error: e } = await supabase.from('tbl_contratos').insert({
      id_prestamo: Number(idPrestamo),
      fecha_inicio: fechaInicio,
      fecha_vencimiento: fechaVenc.toISOString().split('T')[0],
      ubicacion_bien: ubicacion
    }).select().single()

    if (e) { setError(e.message); setFirmando(false); return }
    setContratoId(data.id_contrato)
    setPaso('firmado')
    setFirmando(false)
  }

  const fmt = (n: number) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
  const fmtFecha = (f: string) => new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const fechaVenc = fechaInicio ? (() => { const d = new Date(fechaInicio); d.setMonth(d.getMonth() + Number(prestamo?.plazo_meses || 1)); return d.toISOString().split('T')[0] })() : ''

  /* ── PASO FIRMADO ── */
  if (paso === 'firmado' && cliente && bien && prestamo) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Contrato Firmado</h2>
        <p className="text-gray-500 mb-6">
          Contrato N° <strong>WE-{String(contratoId).padStart(6, '0')}</strong> generado exitosamente.<br />
          Desembolso creado automáticamente por trigger. Préstamo en estado <strong>Activo</strong>.
        </p>
        <div className="bg-white rounded-2xl shadow p-6 text-left mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-gray-400">Cliente</p><p className="font-medium">{cliente.nombre}</p></div>
            <div><p className="text-xs text-gray-400">Documento</p><p className="font-medium">{cliente.documento}</p></div>
            <div><p className="text-xs text-gray-400">Bien</p><p className="font-medium">{bien.descripcion}</p></div>
            <div><p className="text-xs text-gray-400">Monto desembolsado</p><p className="font-medium text-green-700">{fmt(prestamo.monto_aprobado)}</p></div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <a href={`/contratos/${contratoId}`} className="bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-600">
            Ver Contrato Completo
          </a>
          <button onClick={() => { setPaso('seleccion'); setIdCliente(''); setIdBien(''); setIdPrestamo(''); setCliente(null); setBien(null); setPrestamo(null); setAcepta(false); setTermsScrolled(false); setFechaInicio(''); setUbicacion('') }}
            className="border px-6 py-2 rounded-lg hover:bg-gray-50">
            Nuevo Contrato
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-1 text-gray-800">Contratos</h2>
      <p className="text-gray-500 text-sm mb-8">Selecciona el cliente para cargar su información y generar el contrato de empeño.</p>

      {/* ── SECCIÓN 1: SELECCIÓN ── */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">1. Selección</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Cliente</label>
            <select value={idCliente} onChange={e => onClienteChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Bien empeñado</label>
            <select value={idBien} onChange={e => onBienChange(e.target.value)} disabled={!idCliente}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50">
              <option value="">Seleccionar bien</option>
              {bienes.map(b => <option key={b.id_bien} value={b.id_bien}>{b.descripcion}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Préstamo (Pendiente)</label>
            <select value={idPrestamo} onChange={e => onPrestamoChange(e.target.value)} disabled={!idBien}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50">
              <option value="">Seleccionar préstamo</option>
              {prestamos.map(p => <option key={p.id_prestamo} value={p.id_prestamo}>#{p.id_prestamo} — {fmt(p.monto_aprobado)}</option>)}
            </select>
            {idBien && prestamos.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Sin préstamos en Pendiente para este bien.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 2: DATOS AUTO-CARGADOS ── */}
      {cliente && bien && prestamo && (
        <>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">2. Datos del Cliente</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Nombre completo', cliente.nombre],
                  [cliente.tipo_doc, cliente.documento],
                  ['Teléfono', cliente.telefono],
                  ['Correo', cliente.correo],
                  ['Nivel de riesgo', cliente.nivel_riesgo],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">3. Bien y Préstamo</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Artículo', bien.descripcion],
                  ['Categoría', bien.categoria],
                  ['Valor comercial', fmt(bien.valor_comercial)],
                  ['Valor avalúo', fmt(bien.valor_avaluo)],
                  ['Monto aprobado', fmt(prestamo.monto_aprobado)],
                  ['Tasa interés', `${prestamo.tasa_interes}% mensual`],
                  ['Plazo', `${prestamo.plazo_meses} mes(es)`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 4: FECHAS ── */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">4. Datos del Contrato</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha de inicio</label>
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha de vencimiento</label>
                <input type="text" readOnly value={fechaVenc ? fmtFecha(fechaVenc) : '— (calculada automáticamente)'}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ubicación del bien en custodia</label>
                <input placeholder="Ej: Bodega A, Local 3" value={ubicacion} onChange={e => setUbicacion(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 5: CONTRATO LEGAL ── */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-700 mb-1 text-sm uppercase tracking-wide">5. Términos y Condiciones del Contrato</h3>
            <p className="text-xs text-gray-400 mb-4">Desplázate hasta el final para habilitar la aceptación.</p>

            <div ref={termsRef} onScroll={handleTermsScroll}
              className="h-96 overflow-y-auto border border-gray-200 rounded-xl p-6 font-serif text-sm leading-relaxed space-y-4 text-gray-700">

              <div className="text-center border-b pb-4 mb-4">
                <p className="font-bold text-base text-teal-800">WAJIIRA EMPEÑOS S.A.S.</p>
                <p className="text-xs text-gray-500">NIT: 900.000.000-0 — Riohacha, La Guajira, Colombia</p>
                <p className="font-bold mt-2">CONTRATO DE EMPEÑO Y MUTUO CON GARANTÍA PRENDARIA</p>
                <p className="text-xs text-gray-500 mt-1">
                  Entre <strong>{cliente.nombre}</strong> ({cliente.tipo_doc}: {cliente.documento}) como DEUDOR
                  y Wajiira Empeños S.A.S. como ACREEDOR, se celebra el presente contrato:
                </p>
              </div>

              <p><strong className="text-teal-700">PRIMERA — OBJETO.</strong> El DEUDOR entrega voluntariamente a título de prenda el bien denominado <em>"{bien.descripcion}"</em> (categoría: {bien.categoria}), con valor comercial de {fmt(bien.valor_comercial)} y valor de avalúo de {fmt(bien.valor_avaluo)}, como garantía real del préstamo otorgado por {fmt(prestamo.monto_aprobado)} a una tasa de interés del {prestamo.tasa_interes}% mensual, por un plazo de {prestamo.plazo_meses} mes(es).</p>

              <p><strong className="text-teal-700">SEGUNDA — OBLIGACIÓN DE PAGO.</strong> El DEUDOR se compromete a cancelar la totalidad del capital más intereses causados antes o en la fecha de vencimiento del plazo pactado. Los pagos parciales se imputarán primero a intereses y luego a capital. El incumplimiento de cualquier pago generará intereses de mora equivalentes al doble de la tasa pactada sobre el saldo insoluto.</p>

              <p><strong className="text-teal-700">TERCERA — CUSTODIA Y RESPONSABILIDAD DEL BIEN.</strong> Wajiira Empeños S.A.S. asume la custodia del bien prendado y se compromete a conservarlo en las condiciones en que fue recibido. En caso de <strong>pérdida, robo o destrucción total del bien por causa imputable a Wajiira Empeños</strong>, la empresa deberá compensar al DEUDOR con el valor del avalúo pactado ({fmt(bien.valor_avaluo)}), cancelando la deuda sin costo adicional para el DEUDOR. Si la pérdida o deterioro se debe a causa de fuerza mayor (desastre natural, acto terrorista, orden de autoridad), Wajiira Empeños no será responsable, pero liberará al DEUDOR de la obligación de devolver el bien. El DEUDOR deberá igualmente cumplir con el pago del capital prestado.</p>

              <p><strong className="text-teal-700">CUARTA — DETERIORO NORMAL.</strong> Wajiira Empeños no responde por el deterioro natural propio de la antigüedad, desgaste u obsolescencia del bien durante el período de custodia. El DEUDOR declara conocer y aceptar el estado actual del bien al momento de la entrega.</p>

              <p><strong className="text-teal-700">QUINTA — INCUMPLIMIENTO Y PROCESO DE MORA.</strong> Si transcurrida la fecha de vencimiento el DEUDOR no ha cancelado la obligación, el préstamo entrará automáticamente en estado de <strong>MORA</strong>. Wajiira Empeños notificará al DEUDOR a través del correo {cliente.correo} y al teléfono {cliente.telefono} otorgando un plazo adicional de <strong>diez (10) días hábiles</strong> para ponerse al día. Vencido dicho plazo sin que se produzca el pago, se procederá a la ejecución de la garantía prendaria.</p>

              <p><strong className="text-teal-700">SEXTA — EJECUCIÓN Y SUBASTA.</strong> Agotado el plazo de mora sin pago, Wajiira Empeños quedará irrevocablemente autorizada para <strong>subastar el bien prendado</strong> al mejor postor. El producto de la venta se aplicará en el siguiente orden: (1) gastos de custodia y administración; (2) intereses causados; (3) capital. Si el precio de venta supera la deuda total, el excedente será devuelto al DEUDOR dentro de los cinco (5) días hábiles siguientes. Si el precio de venta es inferior a la deuda, el DEUDOR continuará obligado por el saldo restante.</p>

              <p><strong className="text-teal-700">SÉPTIMA — REDENCIÓN ANTICIPADA.</strong> El DEUDOR podrá cancelar anticipadamente la obligación en cualquier momento, pagando el capital más los intereses causados hasta la fecha efectiva de pago, sin penalidad por prepago. Al recibir el pago total, Wajiira Empeños devolverá el bien dentro de las veinticuatro (24) horas hábiles siguientes.</p>

              <p><strong className="text-teal-700">OCTAVA — PROHIBICIONES.</strong> El DEUDOR declara que el bien entregado en prenda es de su propiedad exclusiva, libre de gravámenes, embargos o limitaciones de dominio. Queda prohibido al DEUDOR ceder, vender o gravar el bien mientras esté en custodia de Wajiira Empeños.</p>

              <p><strong className="text-teal-700">NOVENA — TRATAMIENTO DE DATOS PERSONALES.</strong> De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013 (régimen de protección de datos de Colombia), el DEUDOR autoriza a Wajiira Empeños a recopilar, almacenar y utilizar sus datos personales exclusivamente para el cumplimiento de las obligaciones derivadas del presente contrato, el reporte ante centrales de riesgo en caso de incumplimiento, y el envío de comunicaciones relacionadas con el crédito.</p>

              <p><strong className="text-teal-700">DÉCIMA — MARCO LEGAL APLICABLE.</strong> El presente contrato se rige por las disposiciones del <strong>Código Civil Colombiano</strong> (artículos 2409-2431 sobre prenda), el <strong>Código de Comercio</strong>, la <strong>Ley 45 de 1990</strong> (actividad financiera), y demás normas concordantes. Para cualquier controversia, las partes se someten a la jurisdicción de los Jueces Civiles del Circuito de <strong>Riohacha, La Guajira</strong>, renunciando a cualquier otro fuero que pudiere corresponderles.</p>

              <p><strong className="text-teal-700">DÉCIMA PRIMERA — ACEPTACIÓN.</strong> Las partes declaran haber leído íntegramente el presente contrato, entendido su alcance legal y aceptado todas sus cláusulas libre y voluntariamente, en la ciudad de Riohacha, La Guajira, República de Colombia.{fechaInicio ? ` Fecha de firma: ${fmtFecha(fechaInicio)}.` : ''}</p>

              <div className="mt-6 pt-4 border-t text-center text-xs text-gray-400">
                — Fin del contrato — Wajiira Empeños S.A.S. · NIT 900.000.000-0 · Riohacha, La Guajira —
              </div>
            </div>

            {!termsScrolled && (
              <p className="text-xs text-amber-600 mt-2 text-center">↓ Desplázate hasta el final del contrato para continuar</p>
            )}
          </div>

          {/* ── SECCIÓN 6: ACEPTACIÓN Y FIRMA ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">6. Confirmación y Firma</h3>

            <div className={`rounded-xl p-4 mb-4 transition-colors ${termsScrolled ? 'bg-gray-50' : 'bg-gray-100 opacity-50 pointer-events-none'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)}
                  disabled={!termsScrolled}
                  className="mt-1 w-4 h-4 accent-teal-700" />
                <span className="text-sm text-gray-700">
                  <strong>{cliente.nombre}</strong> ({cliente.tipo_doc}: {cliente.documento}) declaro que he leído, entendido y acepto en su totalidad los términos y condiciones del presente Contrato de Empeño y Mutuo con Garantía Prendaria. Entiendo que el bien <strong>"{bien.descripcion}"</strong> quedará en custodia de Wajiira Empeños hasta la cancelación total de la obligación de <strong>{fmt(prestamo.monto_aprobado)}</strong>, y que en caso de incumplimiento el bien podrá ser subastado conforme a lo establecido en la Cláusula Sexta.
                </span>
              </label>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button onClick={firmar} disabled={!acepta || !fechaInicio || !ubicacion || firmando}
              className="w-full bg-teal-700 text-white py-3 rounded-xl hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm transition-colors">
              {firmando ? 'Generando contrato...' : 'Firmar y Formalizar Contrato'}
            </button>

            {(!fechaInicio || !ubicacion) && acepta && (
              <p className="text-xs text-amber-600 text-center mt-2">Completa la fecha de inicio y ubicación del bien (Sección 4)</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
