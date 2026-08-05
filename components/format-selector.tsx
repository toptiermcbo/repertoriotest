'use client'

import Image from 'next/image'
import { Music, Film } from 'lucide-react'

interface FormatSelectorProps {
  onSelect: (format: 'mp3' | 'mp4') => void
}

export function FormatSelector({ onSelect }: FormatSelectorProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(180,20,20,0.18) 0%, #111111 60%)',
      }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <Image
          src="/logo-toptier.png"
          alt="Top Tier Maracaibo"
          width={120}
          height={120}
          className="object-contain mb-1 drop-shadow-lg"
          style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.8))' }}
        />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-white text-balance text-center mb-2">
        Repertorio Musical
      </h1>
      <p className="text-[#888] text-center text-sm max-w-xs mb-10 leading-relaxed">
        Selecciona el formato en el que quieres tu música antes de explorar el catálogo.
      </p>

      {/* Format Cards */}
      <div className="flex gap-4">
        <button
          onClick={() => onSelect('mp3')}
          className="group w-40 h-44 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#1c1c1c] hover:bg-[#252525] hover:border-white/20 transition-all duration-200 cursor-pointer"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
            <Music className="w-6 h-6 text-[#aaa]" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg leading-tight">MP3</p>
            <p className="text-[#888] text-xs mt-1">Solo audio</p>
            <p className="text-[#888] text-xs">Menor tamaño</p>
          </div>
        </button>

        <button
          onClick={() => onSelect('mp4')}
          className="group w-40 h-44 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#1c1c1c] hover:bg-[#252525] hover:border-white/20 transition-all duration-200 cursor-pointer"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
            <Film className="w-6 h-6 text-[#aaa]" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg leading-tight">MP4</p>
            <p className="text-[#888] text-xs mt-1">Audio + Video</p>
            <p className="text-[#888] text-xs">Mayor calidad</p>
          </div>
        </button>
      </div>
    </div>
  )
}
