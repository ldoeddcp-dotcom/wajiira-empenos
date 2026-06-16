'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Contrato = {
  id_contrato: number
  fecha_inicio: string
  fecha_vencimiento: string
  ubicacion_bien: string
  id_prestamo: number
  monto_aprobado: number
  tasa_interes: number
  plazo_meses: string
  id_bien: number
  descripcion_bien: string
  valor_comercial: number
  valor_avaluo: number
  categoria_bien: string
  id_cliente: number
  nombre_cliente: string
  documento_cliente: string
  telefono_cliente: string
  correo_cliente: string
  tipo_documento: string
  estado_prestamo: string
  nivel_riesgo: string
  fecha_desembolso: string
  monto_desembolso: number
  medio_pago_desembolso: string
}

export default function ContratoDetalle() {
  const { id } = useParams()
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      const { data: raw, error } = await supabase
        .from('tbl_contratos')
        .select(`
          id_contrato, fecha_inicio, fecha_vencimiento, ubicacion_bien,
          tbl_prestamo (
            id_prestamo, monto_aprobado, tasa_interes, plazo_meses,
            estado:tbl_tipos_maestra ( tima_nombre ),
            tbl_bienes (
              id_bien, descripcion, valor_comercial, valor_avaluo,
              categoria:tbl_tipos_maestra ( tima_nombre ),
              tbl_cliente (
                id_cliente, id_nivel_riesgo,
                riesgo:tbl_tipos_maestra ( tima_nombre ),
                tbl_personas (
                  nombres_apellidos, documento, telefono, correo,
                  tipodoc:tbl_tipos_maestra ( tima_nombre )
                )
              )
            )
          ),
          tbl_desembolsos ( monto_entrega, fecha_entrega, medio:tbl_tipos_maestra ( tima_nombre ) )
        `)
        .eq('id_contrato', id)
        .single()

      if (error || !raw) { setLoading(false); return }

      const p   = (raw as any).tbl_prestamo
      const b   = p.tbl_bienes
      const cli = b.tbl_cliente
      const pe  = cli.tbl_personas
      const des = (raw as any).tbl_desembolsos?.[0] || (raw as any).tbl_desembolsos

      setContrato({
        id_contrato:          raw.id_contrato,
        fecha_inicio:         raw.fecha_inicio,
        fecha_vencimiento:    raw.fecha_vencimiento,
        ubicacion_bien:       raw.ubicacion_bien,
        id_prestamo:          p.id_prestamo,
        monto_aprobado:       p.monto_aprobado,
        tasa_interes:         p.tasa_interes,
        plazo_meses:          p.plazo_meses,
        id_bien:              b.id_bien,
        descripcion_bien:     b.descripcion,
        valor_comercial:      b.valor_comercial,
        valor_avaluo:         b.valor_avaluo,
        categoria_bien:       b.categoria?.tima_nombre || '',
        id_cliente:           cli.id_cliente,
        nombre_cliente:       pe.nombres_apellidos,
        documento_cliente:    pe.documento,
        telefono_cliente:     pe.telefono,
        correo_cliente:       pe.correo,
        tipo_documento:       pe.tipodoc?.tima_nombre || '',
        estado_prestamo:      p.estado?.tima_nombre || '',
        nivel_riesgo:         cli.riesgo?.tima_nombre || '',
        fecha_desembolso:     des?.fecha_entrega || '',
        monto_desembolso:     des?.monto_entrega || 0,
        medio_pago_desembolso: des?.medio?.tima_nombre || 'Efectivo',
      })
      setLoading(false)
    }
    cargar()
  }, [id])

  async function enviarEmail() {
    if (!contrato) return
    setEnviando(true)
    setError('')
    const res = await fetch('/api/enviar-contrato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contrato })
    })
    const data = await res.json()
    if (data.ok) setEnviado(true)
    else setError(data.error || 'Error al enviar')
    setEnviando(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando contrato...</div>
  if (!contrato) return <div className="text-red-500">Contrato no encontrado.</div>

  const fmt = (n: number) => n?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
  const fmtFecha = (f: string) => new Date(f).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">
          Contrato N° WE-{String(contrato.id_contrato).padStart(6, '0')}
        </h2>
        <div className="flex gap-3">
          {enviado
            ? <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">Enviado a {contrato.correo_cliente}</span>
            : <button onClick={enviarEmail} disabled={enviando}
                className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm">
                {enviando ? 'Enviando...' : 'Enviar al cliente'}
              </button>
          }
          <button onClick={() => window.print()}
            className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
            Imprimir
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 print:hidden">{error}</p>}

      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-4xl font-serif print:shadow-none print:rounded-none" id="contrato">

        {/* ENCABEZADO */}
        <div className="text-center border-b-4 border-double border-teal-700 pb-8 mb-8">
          <h1 className="text-2xl font-bold text-teal-700 tracking-widest">WAJIIRA EMPEÑOS</h1>
          <p className="text-sm text-gray-500 mt-1">NIT: 900.000.000-0 &nbsp;|&nbsp; La Guajira, Colombia &nbsp;|&nbsp; Tel: (57) 310-000-0000</p>
          <p className="text-lg font-bold mt-4 text-gray-800">CONTRATO DE EMPEÑO Y MUTUO CON GARANTÍA PRENDARIA</p>
          <p className="text-sm text-gray-500 mt-1">
            Contrato N° <strong>WE-{String(contrato.id_contrato).padStart(6, '0')}</strong> &nbsp;|&nbsp;
            Préstamo N° <strong>{contrato.id_prestamo}</strong> &nbsp;|&nbsp;
            Estado: <strong className="text-teal-700">{contrato.estado_prestamo}</strong>
          </p>
        </div>

        {/* PARTES */}
        <Section title="I. Partes Contratantes">
          <Grid>
            <Campo label="Acreedor (Prestamista)">Wajiira Empeños S.A.S.</Campo>
            <Campo label="NIT Acreedor">900.000.000-0</Campo>
            <Campo label="Deudor (Cliente)">{contrato.nombre_cliente}</Campo>
            <Campo label={contrato.tipo_documento}>{contrato.documento_cliente}</Campo>
            <Campo label="Teléfono">{contrato.telefono_cliente}</Campo>
            <Campo label="Correo electrónico">{contrato.correo_cliente}</Campo>
          </Grid>
        </Section>

        {/* BIEN */}
        <Section title="II. Objeto del Contrato — Bien en Garantía">
          <Grid>
            <Campo label="Descripción del bien">{contrato.descripcion_bien}</Campo>
            <Campo label="Categoría">{contrato.categoria_bien}</Campo>
            <Campo label="Valor comercial">{fmt(contrato.valor_comercial)}</Campo>
            <Campo label="Valor avalúo">{fmt(contrato.valor_avaluo)}</Campo>
            <Campo label="Ubicación en custodia">{contrato.ubicacion_bien}</Campo>
            <Campo label="Nivel de riesgo cliente">{contrato.nivel_riesgo}</Campo>
          </Grid>
        </Section>

        {/* CONDICIONES */}
        <Section title="III. Condiciones del Préstamo">
          <Grid>
            <Campo label="Monto aprobado">{fmt(contrato.monto_aprobado)}</Campo>
            <Campo label="Tasa de interés mensual">{contrato.tasa_interes}%</Campo>
            <Campo label="Plazo">{contrato.plazo_meses} mes(es)</Campo>
            <Campo label="Fecha de inicio">{fmtFecha(contrato.fecha_inicio)}</Campo>
            <Campo label="Fecha de vencimiento">{fmtFecha(contrato.fecha_vencimiento)}</Campo>
            <Campo label="Medio de desembolso">{contrato.medio_pago_desembolso || 'Efectivo'}</Campo>
          </Grid>
          <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-4 text-sm text-amber-800">
            ⚠️ El deudor deberá cancelar {fmt(contrato.monto_aprobado)} más intereses al {contrato.tasa_interes}% mensual a más tardar el {fmtFecha(contrato.fecha_vencimiento)}.
          </div>
        </Section>

        {/* CLÁUSULAS */}
        <Section title="IV. Cláusulas y Condiciones">
          {[
            ['PRIMERA — ENTREGA DEL BIEN', `El deudor entrega en este acto, a título de prenda, el bien descrito en el numeral II, el cual quedará bajo custodia de Wajiira Empeños en la ubicación indicada, en perfecto estado de conservación, hasta la cancelación total de la obligación.`],
            ['SEGUNDA — OBLIGACIÓN DE PAGO', `El deudor se obliga a cancelar la suma de ${fmt(contrato.monto_aprobado)} más los intereses pactados del ${contrato.tasa_interes}% mensual a más tardar el día ${fmtFecha(contrato.fecha_vencimiento)}. Los pagos parciales se imputarán primero a intereses y luego a capital.`],
            ['TERCERA — MORA E INTERESES MORATORIOS', `En caso de incumplimiento en la fecha de vencimiento, se causarán intereses de mora equivalentes al doble de la tasa pactada sobre el saldo insoluto, sin perjuicio de las acciones legales correspondientes.`],
            ['CUARTA — CLÁUSULA DE EJECUCIÓN Y SUBASTA', `Si transcurridos diez (10) días hábiles desde la fecha de vencimiento el deudor no ha cancelado la totalidad de la obligación, Wajiira Empeños queda irrevocablemente facultada para proceder a la venta pública (subasta) del bien prendado, aplicando el producto de la venta al pago de capital, intereses y gastos de custodia. El remanente, si lo hubiere, será devuelto al deudor.`],
            ['QUINTA — CUSTODIA Y CONSERVACIÓN', `Wajiira Empeños se compromete a conservar el bien prendado en condiciones adecuadas durante el término del contrato, respondiendo por daños atribuibles a negligencia en su custodia.`],
            ['SEXTA — REDENCIÓN ANTICIPADA', `El deudor podrá cancelar anticipadamente el préstamo en cualquier momento, pagando el capital y los intereses causados hasta la fecha de pago efectivo, sin penalidad por prepago.`],
            ['SÉPTIMA — LEY APLICABLE', `Las partes se someten a la jurisdicción de los Jueces Civiles del Circuito de Riohacha, La Guajira, y a las normas del Código Civil y Código de Comercio de la República de Colombia.`],
            ['OCTAVA — ACEPTACIÓN', `Las partes declaran haber leído, entendido y aceptado en su integridad el presente contrato, firmado en dos (2) ejemplares en la ciudad de Riohacha, La Guajira, el día ${fmtFecha(contrato.fecha_inicio)}.`],
          ].map(([titulo, texto]) => (
            <p key={titulo} className="text-sm leading-relaxed text-justify mb-4">
              <strong className="text-teal-700">{titulo}: </strong>{texto}
            </p>
          ))}
        </Section>

        {/* FIRMAS */}
        <div className="grid grid-cols-2 gap-16 mt-16">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-3">
              <p className="text-sm font-bold">WAJIIRA EMPEÑOS S.A.S.</p>
              <p className="text-xs text-gray-500">NIT: 900.000.000-0</p>
              <p className="text-xs text-gray-500">Representante Legal</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-3">
              <p className="text-sm font-bold">{contrato.nombre_cliente}</p>
              <p className="text-xs text-gray-500">{contrato.tipo_documento}: {contrato.documento_cliente}</p>
              <p className="text-xs text-gray-500">El Deudor</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-4 text-center text-xs text-gray-400">
          Documento generado electrónicamente por el sistema Wajiira Empeños — Contrato N° WE-{String(contrato.id_contrato).padStart(6, '0')} — {new Date().toLocaleDateString('es-CO')}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold text-teal-700 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-8 gap-y-3">{children}</div>
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-800">{children}</p>
    </div>
  )
}
