'use client'

import { MessageCircle, HardDrive } from 'lucide-react'

type PendriveSize = '16' | '32' | '64' | '128'

interface BottomBarProps {
  selectedCount: number
  totalMb: number
  pendriveSize: PendriveSize | null
  onPendriveChange: (size: PendriveSize) => void
  onClear: () => void
  onUndo: () => void
  canUndo: boolean
  onWhatsApp: () => void
}

const SIZES: { value: PendriveSize; label: string }[] = [
  { value: '16', label: '16 GB' },
  { value: '32', label: '32 GB' },
  { value: '64', label: '64 GB' },
  { value: '128', label: '128 GB' },
]

function formatMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${Math.round(mb)} MB`
}

export function BottomBar({
  selectedCount,
  totalMb,
  pendriveSize,
  onPendriveChange,
  onClear,
  onUndo,
  canUndo,
  onWhatsApp,
}: BottomBarProps) {
  const totalGb = totalMb / 1024
  const limitGb = pendriveSize === null ? null : parseInt(pendriveSize)
  const overLimit = limitGb !== null && totalGb > limitGb

  // Progress bar
  const progressPct =
    limitGb !== null ? Math.min((totalGb / limitGb) * 100, 100) : 0
  const availableGb = limitGb !== null ? Math.max(limitGb - totalGb, 0) : null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 bg-[#111]/95 backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-4 pt-3 pb-3 space-y-2">
        {/* Pendrive selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[#888] text-xs font-medium">
            <HardDrive className="w-3.5 h-3.5" />
            <span>PENDRIVE:</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => onPendriveChange(s.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer
                  ${
                    pendriveSize === s.value
                      ? 'bg-[#2a2a2a] text-white border border-white/20'
                      : 'text-[#666] hover:text-[#aaa] border border-transparent hover:border-white/10'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar — only when a pendrive size is selected */}
        {limitGb !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className={overLimit ? 'text-red-400' : 'text-[#aaa]'}>
                <span className="font-semibold">{totalGb.toFixed(2)} GB</span>{' '}
                usados de {limitGb} GB
              </span>
              <span className="text-[#666]">
                Disponible: {availableGb!.toFixed(2)} GB
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#2a2a2a] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  overLimit ? 'bg-red-500' : 'bg-red-600'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p
                className={`text-xl font-bold leading-none ${
                  selectedCount > 0 ? 'text-red-500' : 'text-red-600/60'
                }`}
              >
                {selectedCount}
              </p>
              <p className="text-[10px] text-[#555] uppercase tracking-wider mt-0.5">
                Selección
              </p>
            </div>
            {selectedCount > 0 && (
              <>
                <div className="text-center">
                  <p className="text-lg font-bold leading-none text-white">
                    {Math.round(totalMb).toLocaleString('es')}
                    <span className="text-sm font-normal text-[#666] ml-1">MB</span>
                  </p>
                  <p className="text-[10px] text-[#555] uppercase tracking-wider mt-0.5">
                    Total
                  </p>
                </div>
                <div className="text-center">
                  <p
                    className={`text-lg font-bold leading-none ${
                      overLimit ? 'text-red-500' : 'text-white'
                    }`}
                  >
                    {totalGb.toFixed(2)}
                    <span className="text-sm font-normal text-[#666] ml-1">GB</span>
                  </p>
                  <p className="text-[10px] text-[#555] uppercase tracking-wider mt-0.5">
                    En GB
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {selectedCount > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-[#666] hover:text-[#aaa] transition-colors cursor-pointer whitespace-nowrap"
              >
                Limpiar todo
              </button>
            )}
            {canUndo && (
              <button
                onClick={onUndo}
                className="text-xs text-[#666] hover:text-[#aaa] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <span>&#8617;</span> Deshacer
              </button>
            )}
          </div>
        </div>

        {/* WhatsApp button */}
        <button
          onClick={onWhatsApp}
          disabled={selectedCount === 0}
          title={selectedCount === 0 ? 'Selecciona al menos un artista' : ''}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer
            ${
              selectedCount > 0
                ? 'bg-[#4ade80] hover:bg-[#22c55e] text-black'
                : 'bg-[#181818] text-[#444] border border-white/5 cursor-not-allowed'
            }`}
        >
          <MessageCircle className="w-4 h-4" />
          Enviar pedido por WhatsApp
        </button>

        {overLimit && (
          <p className="text-xs text-red-500 text-center">
            El contenido supera la capacidad del pendrive de {limitGb} GB
          </p>
        )}
      </div>
    </div>
  )
}
