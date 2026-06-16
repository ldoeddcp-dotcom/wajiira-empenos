export type ProcesoInfo = {
  numero: number
  nombre: string
  trigger: string
  tabla: string
  reglas: string[]
}

export default function ProcesoHeader({ proceso }: { proceso: ProcesoInfo }) {
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-teal-700 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
          {proceso.numero}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-teal-800 text-sm">Proceso {proceso.numero}: {proceso.nombre}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="text-xs font-mono bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
              {proceso.trigger}()
            </span>
            <span className="text-xs text-teal-600">{proceso.tabla}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {proceso.reglas.map(r => (
              <span key={r} className="text-xs bg-white border border-teal-200 text-teal-700 px-2 py-0.5 rounded">
                ✓ {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
