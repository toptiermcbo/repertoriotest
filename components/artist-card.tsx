'use client'

import { Check } from 'lucide-react'
import type { Artist } from '@/lib/genres'

type Format = 'mp3' | 'mp4'

interface ArtistCardProps {
  artist: Artist
  selected: boolean
  format: Format
  genreEmoji: string
  onToggle: (name: string) => void
}

function formatSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${Math.round(mb)} MB`
}

export function ArtistCard({ artist, selected, format, genreEmoji, onToggle }: ArtistCardProps) {
  const sizeMb = format === 'mp3' ? artist.mp3Mb : artist.mp4Mb

  return (
    <button
      onClick={() => onToggle(artist.name)}
      className={`relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-150 cursor-pointer w-full
        ${
          selected
            ? 'border-red-600/70 bg-red-950/30 ring-1 ring-red-600/40'
            : 'border-white/8 bg-[#1c1c1c] hover:bg-[#222] hover:border-white/15'
        }`}
    >
      {/* Emoji badge */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-[#2a2a2a] flex items-center justify-center text-lg">
        {genreEmoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate leading-tight ${selected ? 'text-white' : 'text-[#ccc]'}`}>
          {artist.name}
        </p>
        <p className="text-[11px] text-[#666] mt-0.5">{artist.songs} canciones • {formatSize(sizeMb)}</p>
      </div>

      {/* Checkmark */}
      {selected && (
        <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-600">
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}
