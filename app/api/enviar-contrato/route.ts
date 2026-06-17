import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const body = await req.json()
  const { contrato } = body

  const fechaInicio = new Date(contrato.fecha_inicio).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const fechaVenc   = new Date(contrato.fecha_vencimiento).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const monto       = Number(contrato.monto_aprobado).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
  const avaluo      = Number(contrato.valor_avaluo).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Georgia', serif; color: #1a1a1a; margin: 0; padding: 0; background: #fff; }
  .container { max-width: 750px; margin: 0 auto; padding: 40px; }
  .header { text-align: center; border-bottom: 3px double #0f766e; padding-bottom: 24px; margin-bottom: 32px; }
  .header h1 { font-size: 22px; color: #0f766e; letter-spacing: 2px; margin: 0; }
  .header p { margin: 6px 0 0; color: #555; font-size: 13px; }
  .contrato-num { font-size: 13px; color: #888; text-align: right; margin-bottom: 24px; }
  h2 { font-size: 13px; color: #0f766e; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 32px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-top: 12px; }
  .campo { font-size: 13px; margin: 4px 0; }
  .campo span { color: #888; font-size: 12px; display: block; }
  .clausula { font-size: 13px; line-height: 1.8; margin: 10px 0; text-align: justify; }
  .clausula strong { color: #0f766e; }
  .firma { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .firma-box { border-top: 1px solid #333; padding-top: 8px; text-align: center; font-size: 12px; color: #555; }
  .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 11px; color: #aaa; }
  .alerta { background: #fef3c7; border-left: 4px solid #d97706; padding: 12px 16px; font-size: 12px; margin: 16px 0; }
</style></head>
<body>
<div class="container">

  <div class="header">
    <h1>WAJIIRA EMPEÑOS</h1>
    <p>NIT: 900.000.000-0 &nbsp;|&nbsp; La Guajira, Colombia &nbsp;|&nbsp; Tel: (57) 310-000-0000</p>
    <p style="margin-top:8px;font-size:15px;font-weight:bold;color:#1a1a1a">CONTRATO DE EMPEÑO Y MUTUO CON GARANTÍA PRENDARIA</p>
  </div>

  <div class="contrato-num">Contrato N° <strong>WE-${String(contrato.id_contrato).padStart(6, '0')}</strong> &nbsp;|&nbsp; Préstamo N° <strong>${contrato.id_prestamo}</strong></div>

  <h2>I. Partes Contratantes</h2>
  <div class="grid">
    <div class="campo"><span>Acreedor (Prestamista)</span>Wajiira Empeños S.A.S.</div>
    <div class="campo"><span>NIT Acreedor</span>900.000.000-0</div>
    <div class="campo"><span>Deudor (Cliente)</span>${contrato.nombre_cliente}</div>
    <div class="campo"><span>${contrato.tipo_documento}</span>${contrato.documento_cliente}</div>
    <div class="campo"><span>Teléfono</span>${contrato.telefono_cliente}</div>
    <div class="campo"><span>Correo electrónico</span>${contrato.correo_cliente}</div>
  </div>

  <h2>II. Objeto del Contrato — Bien en Garantía</h2>
  <div class="grid">
    <div class="campo"><span>Descripción del bien</span>${contrato.descripcion_bien}</div>
    <div class="campo"><span>Categoría</span>${contrato.categoria_bien}</div>
    <div class="campo"><span>Valor comercial</span>${avaluo}</div>
    <div class="campo"><span>Valor avalúo</span>${avaluo}</div>
    <div class="campo"><span>Ubicación custodia</span>${contrato.ubicacion_bien}</div>
    <div class="campo"><span>Nivel de riesgo cliente</span>${contrato.nivel_riesgo}</div>
  </div>

  <h2>III. Condiciones del Préstamo</h2>
  <div class="grid">
    <div class="campo"><span>Monto aprobado</span>${monto}</div>
    <div class="campo"><span>Tasa de interés mensual</span>${contrato.tasa_interes}%</div>
    <div class="campo"><span>Plazo</span>${contrato.plazo_meses} mes(es)</div>
    <div class="campo"><span>Fecha de inicio</span>${fechaInicio}</div>
    <div class="campo"><span>Fecha de vencimiento</span>${fechaVenc}</div>
    <div class="campo"><span>Medio de desembolso</span>${contrato.medio_pago_desembolso || 'Efectivo'}</div>
  </div>

  <div class="alerta">
    ⚠️ <strong>Valor total a pagar al vencimiento:</strong> el deudor deberá cancelar el capital más los intereses causados al ${contrato.tasa_interes}% mensual dentro del plazo establecido.
  </div>

  <h2>IV. Cláusulas y Condiciones</h2>

  <p class="clausula"><strong>PRIMERA — ENTREGA DEL BIEN:</strong> El deudor entrega en este acto, a título de prenda, el bien descrito en el numeral II, el cual quedará bajo custodia de Wajiira Empeños en la ubicación indicada, en perfecto estado de conservación, hasta la cancelación total de la obligación.</p>

  <p class="clausula"><strong>SEGUNDA — OBLIGACIÓN DE PAGO:</strong> El deudor se obliga a cancelar la suma de ${monto} más los intereses pactados del ${contrato.tasa_interes}% mensual a más tardar el día ${fechaVenc}. Los pagos parciales se imputarán primero a intereses y luego a capital.</p>

  <p class="clausula"><strong>TERCERA — MORA E INTERESES MORATORIOS:</strong> En caso de incumplimiento en la fecha de vencimiento, se causarán intereses de mora equivalentes al doble de la tasa pactada sobre el saldo insoluto, sin perjuicio de las acciones legales correspondientes.</p>

  <p class="clausula"><strong>CUARTA — CLÁUSULA DE EJECUCIÓN Y SUBASTA:</strong> Si transcurridos diez (10) días hábiles desde la fecha de vencimiento el deudor no ha cancelado la totalidad de la obligación, Wajiira Empeños queda irrevocablemente facultada para proceder a la venta pública (subasta) del bien prendado, aplicando el producto de la venta al pago de capital, intereses y gastos de custodia. El remanente, si lo hubiere, será devuelto al deudor.</p>

  <p class="clausula"><strong>QUINTA — CUSTODIA Y CONSERVACIÓN:</strong> Wajiira Empeños se compromete a conservar el bien prendado en condiciones adecuadas durante el término del contrato, respondiendo por daños atribuibles a negligencia en su custodia. No responde por deterioro natural del bien.</p>

  <p class="clausula"><strong>SEXTA — REDENCIÓN ANTICIPADA:</strong> El deudor podrá cancelar anticipadamente el préstamo en cualquier momento, pagando el capital y los intereses causados hasta la fecha de pago efectivo, sin penalidad por prepago.</p>

  <p class="clausula"><strong>SÉPTIMA — CESIÓN:</strong> Este contrato y la garantía prendaria no podrán ser cedidos por el deudor sin autorización escrita de Wajiira Empeños.</p>

  <p class="clausula"><strong>OCTAVA — DOMICILIO Y LEY APLICABLE:</strong> Para todos los efectos legales derivados del presente contrato, las partes se someten a la jurisdicción de los Jueces Civiles del Circuito de Riohacha, La Guajira, y a las normas del Código Civil y Código de Comercio de la República de Colombia.</p>

  <p class="clausula"><strong>NOVENA — ACEPTACIÓN:</strong> Las partes declaran haber leído, entendido y aceptado en su integridad el presente contrato, el cual se firma en dos (2) ejemplares del mismo tenor y valor, en la ciudad de Riohacha, La Guajira, el día ${fechaInicio}.</p>

  <div class="firma">
    <div class="firma-box">
      <strong>WAJIIRA EMPEÑOS S.A.S.</strong><br>
      NIT: 900.000.000-0<br>
      Representante Legal
    </div>
    <div class="firma-box">
      <strong>${contrato.nombre_cliente}</strong><br>
      ${contrato.tipo_documento}: ${contrato.documento_cliente}<br>
      El Deudor
    </div>
  </div>

  <div class="footer">
    Este documento fue generado electrónicamente por el sistema Wajiira Empeños.<br>
    Contrato N° WE-${String(contrato.id_contrato).padStart(6, '0')} — ${new Date().toLocaleDateString('es-CO')}
  </div>
</div>
</body>
</html>`

  try {
    const destino = process.env.RESEND_TO_EMAIL || contrato.correo_cliente

    await resend.emails.send({
      from: 'Wajiira Empeños <onboarding@resend.dev>',
      to: destino,
      subject: `Contrato de Empeño N° WE-${String(contrato.id_contrato).padStart(6, '0')} — Wajiira Empeños`,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
