'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { GENRES } from '@/lib/genres'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleMigrateData = async () => {
    setLoading(true)
    setStatus('idle')
    setMessage('Iniciando migración...')

    try {
      // Clear existing data
      setMessage('🧹 Borrando datos existentes...')
      await supabase.from('artists').delete().neq('id', '')
      await supabase.from('genres').delete().neq('id', '')

      // Insert genres and artists
      setMessage('📝 Insertando géneros y artistas...')

      let totalGenres = 0
      let totalArtists = 0

      for (const genre of GENRES) {
        // Insert genre
        const { error: genreError } = await supabase.from('genres').insert({
          id: genre.id,
          name: genre.name,
          emoji: genre.emoji,
        })

        if (!genreError) {
          totalGenres++
        }

        // Insert artists for this genre
        for (const artist of genre.artistList) {
          const { error: artistError } = await supabase.from('artists').insert({
            id: `${genre.id}-${artist.name}`,
            genre_id: genre.id,
            name: artist.name,
            songs: artist.songs,
            mp3_mb: artist.mp3Mb,
            mp4_mb: artist.mp4Mb,
          })

          if (!artistError) {
            totalArtists++
          }
        }
      }

      setMessage(`🎉 Migración completada!\n✅ ${totalGenres} géneros\n✅ ${totalArtists} artistas`)
      setStatus('success')
    } catch (error) {
      console.error('[v0] Migration error:', error)
      setMessage(`❌ Error en la migración: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#222] border border-white/10 rounded-3xl p-8">
        <h1 className="text-3xl font-bold mb-2">Configuración</h1>
        <p className="text-[#888] mb-8">Migración de datos a Supabase</p>

        <div className="space-y-4">
          <p className="text-sm text-[#aaa]">
            Esta página migra los datos del catálogo local al servidor de Supabase. Esto debe hacerse una sola vez.
          </p>

          <button
            onClick={handleMigrateData}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Migrando...
              </>
            ) : (
              '🚀 Migrar datos ahora'
            )}
          </button>

          {status === 'success' && (
            <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-200 whitespace-pre-wrap">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 whitespace-pre-wrap">{message}</p>
            </div>
          )}

          {status === 'idle' && message && (
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-200">{message}</p>
            </div>
          )}

          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-white/5">
            <h3 className="font-semibold text-sm mb-2">ℹ️ Requisitos:</h3>
            <ul className="text-xs text-[#888] space-y-1">
              <li>✅ Supabase debe estar conectado</li>
              <li>✅ Las tablas deben estar creadas</li>
              <li>✅ Las variables de entorno deben estar configuradas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
