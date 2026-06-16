'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Prestamo = { id_prestamo: number; monto_aprobado: number; id_bien: number; id_tipo_estado: number }
type Contrato = { id_contrato: number; fecha_vencimiento: string; id_prestamo: number }

export default function Mora() {
  const [vencidos, setVencidos] = useState<(Contrato & { prestamo: Prestamo })[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)

  async function cargar() {
    setLoading(true)
    const hoy = new Date().toISOString().split('T')[0]
    const { data: contratos } = await supabase
      .from('tbl_contratos')
      .select('id_contrato, fecha_vencimiento, id_prestamo, tbl_prestamo(id_prestamo, monto_aprobado, id_bien, id_tipo_estado)')
      .lt('fecha_vencimiento', hoy)
    const filtrados = (contratos || []).filter((c: any) => {
      const cod = c.tbl_prestamo?.id_tipo_estado
      return cod !== 13 && cod !== 16
    })
    setVencidos(filtrados.map((c: any) => ({ ...c, prestamo: c.tbl_prestamo })))
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  async function marcarMora() {
    setProcesando(true)
    const { data: idActivo } = await supabase.from('tbl_tipos_maestra').select('id_tima').eq('tima_codigo', 'EST_ACTIVO').single()
    const { data: idMora } = await supabase.from('tbl_tipos_maestra').select('id_tima').eq('tima_codigo', 'EST_MORA').single()
    if (!idActivo || !idMora) { alert('Error obteniendo estados'); setProcesando(false); return }
    const hoy = new Date().toISOString().split('T')[0]
    const { data: contratos } = await supabase
      .from('tbl_contratos').select('id_prestamo').lt('fecha_vencimiento', hoy)
    const ids = (contratos || []).map((c: any) => c.id_prestamo)
    if (ids.length === 0) { alert('No hay prestamos para marcar en mora.'); setProcesando(false); return }
    const { error } = await supabase.from('tbl_prestamo')
      .update({ id_tipo_estado: idMora.id_tima })
      .in('id_prestamo', ids)
      .eq('id_tipo_estado', idActivo.id_tima)
    if (error) alert(error.message)
    else alert('Prestamos marcados en mora correctamente.')
    setProcesando(false)
    cargar()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Mora y Recuperacion</h2>
          <p className="text-sm text-gray-500 mt-1">Prestamos con fecha de vencimiento superada</p>
        </div>
        <button onClick={marcarMora} disabled={procesando}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 disabled:opacity-50">
          {procesando ? 'Procesando...' : 'Marcar en Mora'}
        </button>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <>
          {vencidos.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
              {vencidos.length} contrato(s) vencido(s). Haz clic en &quot;Marcar en Mora&quot; para actualizar estados.
            </div>
          )}
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Contrato</th>
                  <th className="px-4 py-3 text-left">Prestamo</th>
                  <th className="px-4 py-3 text-left">Bien</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-left">Vencio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vencidos.map(c => (
                  <tr key={c.id_contrato} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">#{c.id_contrato}</td>
                    <td className="px-4 py-3">#{c.id_prestamo}</td>
                    <td className="px-4 py-3">Bien #{c.prestamo?.id_bien}</td>
                    <td className="px-4 py-3 text-right">${c.prestamo?.monto_aprobado?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{c.fecha_vencimiento}</td>
                  </tr>
                ))}
                {vencidos.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay contratos vencidos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
