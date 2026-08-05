'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { FormatSelector } from '@/components/format-selector'
import { MusicCatalog } from '@/components/music-catalog'
import { AdminPanel } from '@/components/admin-panel'

type Format = 'mp3' | 'mp4'

export default function Page() {
  const [format, setFormat] = useState<Format | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)

  if (showAdmin) {
    return <AdminPanel onClose={() => setShowAdmin(false)} />
  }

  if (!format) {
    return (
      <>
        <FormatSelector onSelect={setFormat} />
        <button
          onClick={() => setShowAdmin(true)}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[#222] hover:bg-[#333] border border-white/10 hover:border-white/20 transition"
          title="Panel de Administrador"
        >
          <Settings className="w-5 h-5 text-[#666] hover:text-white" />
        </button>
      </>
    )
  }

  return (
    <>
      <MusicCatalog format={format} onChangeFormat={() => setFormat(null)} />
      <button
        onClick={() => setShowAdmin(true)}
        className="fixed bottom-40 right-6 z-40 p-3 rounded-full bg-[#222] hover:bg-[#333] border border-white/10 hover:border-white/20 transition"
        title="Panel de Administrador"
      >
        <Settings className="w-5 h-5 text-[#666] hover:text-white" />
      </button>
    </>
  )
}
