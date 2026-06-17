'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type FilaMora = {
  id_contrato: number
  fecha_vencimiento: string
  id_prestamo: number
  monto_aprobado: number
  id_bien: number
  id_tipo_estado: number
  estado_nombre: string
  nombre_cliente: string
  documento_cliente: string
}

function diasVencido(fecha: string): number {
  const hoy = new Date()
  const venc = new Date(fecha + 'T00:00:00')
  return Math.floor((hoy.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24))
}

export default function Mora() {
  const [vencidos, setVencidos] = useState<FilaMora[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)

  async function cargar() {
    setLoading(true)
    const hoy = new Date().toISOString().split('T')[0]
    const { data: contratos } = await supabase
      .from('tbl_contratos')
      .select(`
        id_contrato, fecha_vencimiento, id_prestamo,
        tbl_prestamo(
          id_prestamo, monto_aprobado, id_bien, id_tipo_estado,
          estado:tbl_tipos_maestra(tima_nombre),
          tbl_bienes(
            tbl_cliente(
              tbl_personas(nombres_apellidos, documento)
            )
          )
        )
      `)
      .lt('fecha_vencimiento', hoy)

    const filtrados = (contratos || []).filter((c: any) => {
      const cod = c.tbl_prestamo?.id_tipo_estado
      return cod !== 13 && cod !== 16
    })

    setVencidos(filtrados.map((c: any) => ({
      id_contrato:       c.id_contrato,
      fecha_vencimiento: c.fecha_vencimiento,
      id_prestamo:       c.id_prestamo,
      monto_aprobado:    c.tbl_prestamo?.monto_aprobado,
      id_bien:           c.tbl_prestamo?.id_bien,
      id_tipo_estado:    c.tbl_prestamo?.id_tipo_estado,
      estado_nombre:     c.tbl_prestamo?.estado?.tima_nombre || '—',
      nombre_cliente:    c.tbl_prestamo?.tbl_bienes?.tbl_cliente?.tbl_personas?.nombres_apellidos || '—',
      documento_cliente: c.tbl_prestamo?.tbl_bienes?.tbl_cliente?.tbl_personas?.documento || '—',
    })))
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  async function marcarMora() {
    setProcesando(true)
    if (porMarcar.length === 0) { alert('No hay prestamos activos para marcar en mora.'); setProcesando(false); return }
    const { data: idMora } = await supabase.from('tbl_tipos_maestra').select('id_tima').eq('tima_codigo', 'EST_MORA').single()
    if (!idMora) { alert('Error obteniendo estado mora'); setProcesando(false); return }
    const ids = porMarcar.map(v => v.id_prestamo)
    const { data: actualizados, error } = await supabase.from('tbl_prestamo')
      .update({ id_tipo_estado: idMora.id_tima })
      .in('id_prestamo', ids)
      .select('id_prestamo')
    if (error) alert(error.message)
    else if (!actualizados || actualizados.length === 0) alert('No se pudo actualizar ningun prestamo. Verifique los estados en la base de datos.')
    else alert(`${actualizados.length} prestamo(s) marcados en mora correctamente.`)
    setProcesando(false)
    cargar()
  }

  const porMarcar = vencidos.filter(v =>
    v.estado_nombre.toLowerCase().includes('activ')
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Mora y Recuperacion</h2>
          <p className="text-sm text-gray-500 mt-1">Prestamos con fecha de vencimiento superada</p>
        </div>
        <button onClick={marcarMora} disabled={procesando || porMarcar.length === 0}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 disabled:opacity-50">
          {procesando
            ? 'Procesando...'
            : porMarcar.length > 0
              ? `Marcar en Mora (${porMarcar.length})`
              : 'Sin activos vencidos'}
        </button>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <>
          {porMarcar.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
              {porMarcar.length} prestamo(s) activo(s) vencido(s). Haz clic en &quot;Marcar en Mora&quot; para actualizar estados.
            </div>
          )}
          {vencidos.filter(v => !v.estado_nombre.toLowerCase().includes('activ')).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
              {vencidos.filter(v => !v.estado_nombre.toLowerCase().includes('activ')).length} prestamo(s) ya en mora.
              Registra pagos desde <Link href="/pagos" className="underline font-medium">Pagos</Link> o
              inicia subasta desde <Link href="/subastas" className="underline font-medium">Subastas</Link>.
            </div>
          )}

          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Contrato</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Prestamo</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-left">Vencio</th>
                  <th className="px-4 py-3 text-right">Dias</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vencidos.map(c => {
                  const dias = diasVencido(c.fecha_vencimiento)
                  const esMora = !c.estado_nombre.toLowerCase().includes('activ')
                  return (
                    <tr key={c.id_contrato} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">#{c.id_contrato}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{c.nombre_cliente}</p>
                        <p className="text-xs text-gray-400">{c.documento_cliente}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">#{c.id_prestamo}</td>
                      <td className="px-4 py-3 text-right font-medium">${c.monto_aprobado?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">{c.fecha_vencimiento}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold tabular-nums ${
                          dias > 30 ? 'text-red-600' : dias > 10 ? 'text-amber-600' : 'text-yellow-600'
                        }`}>
                          {dias}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          esMora ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {c.estado_nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-3 items-center">
                        <Link href={`/contratos/${c.id_contrato}`}
                          className="text-teal-700 hover:underline text-xs whitespace-nowrap">
                          Ver Contrato
                        </Link>
                        {esMora && (
                          <Link href="/pagos"
                            className="text-blue-600 hover:underline text-xs whitespace-nowrap">
                            Registrar Pago
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {vencidos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      No hay contratos vencidos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
