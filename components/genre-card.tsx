'use client'

import { Genre } from '@/lib/genres'
import { Check, Minus } from 'lucide-react'

type Format = 'mp3' | 'mp4'
type SelectionState = 'none' | 'partial' | 'full'

interface GenreCardProps {
  genre: Genre
  selectionState: SelectionState
  selectedCount: number
  format: Format
  onOpen: () => void
}

function formatSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${Math.round(mb)} MB`
}

export function GenreCard({ genre, selectionState, selectedCount, format, onOpen }: GenreCardProps) {
  const sizeMb = genre.totalSizeMb[format]
  const selected = selectionState !== 'none'

  return (
    <button
      onClick={onOpen}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 min-h-[120px] text-center transition-all duration-150 cursor-pointer w-full
        ${
          selected
            ? 'border-red-600/70 bg-red-950/30 ring-1 ring-red-600/40'
            : 'border-white/8 bg-[#1c1c1c] hover:bg-[#222] hover:border-white/15'
        }`}
    >
      {/* Selection indicator top-right */}
      {selectionState === 'full' && (
        <span className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-600">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </span>
      )}
      {selectionState === 'partial' && (
        <span className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-800/80 border border-red-600/60">
          <Minus className="w-3 h-3 text-red-300" strokeWidth={3} />
        </span>
      )}

      <span className="text-2xl leading-none">{genre.emoji}</span>
      <p
        className={`text-sm font-semibold leading-tight text-balance ${
          selected ? 'text-white' : 'text-[#ccc]'
        }`}
      >
        {genre.name}
      </p>
      <p className="text-[11px] text-[#666]">{genre.artists} artistas • {formatSize(sizeMb)}</p>

      {selected ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-semibold text-white">
          {selectedCount} selec.
        </span>
      ) : (
        <p className="text-[10px] italic text-[#444]">Toque para seleccionar</p>
      )}
    </button>
  )
}
