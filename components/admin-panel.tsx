'use client'

import { useState, useEffect } from 'react'
import { Lock, Plus, Trash2, Edit, Save, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react'
import { fetchGenresFromDB, fetchArtistsByGenreFromDB, GenreRow, ArtistRow } from '@/lib/supabase-client'
import { addGenre, updateGenre, deleteGenre, addArtist, updateArtist, deleteArtist } from '@/lib/supabase-admin'

interface AdminPanelProps {
  onClose: () => void
}

interface EditingGenre {
  id: string
  name: string
  emoji: string
}

interface EditingArtist {
  id: string
  genreId: string
  name: string
  songs: number
  mp3Mb: number
  mp4Mb: number
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [pinInput, setPinInput] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Data from Supabase
  const [genres, setGenres] = useState<GenreRow[]>([])
  const [artistsByGenre, setArtistsByGenre] = useState<Map<string, ArtistRow[]>>(new Map())

  // UI states
  const [editingGenre, setEditingGenre] = useState<EditingGenre | null>(null)
  const [editingArtist, setEditingArtist] = useState<EditingArtist | null>(null)
  const [expandedGenreId, setExpandedGenreId] = useState<string | null>(null)
  const [newGenre, setNewGenre] = useState({ name: '', emoji: '' })
  const [newArtist, setNewArtist] = useState({ genreId: '', name: '', songs: 0, mp3Mb: 0, mp4Mb: 0 })

  const ADMIN_PIN = '3060'

  // Load data from Supabase when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadGenres()
    }
  }, [isAuthenticated])

  const loadGenres = async () => {
    setLoading(true)
    try {
      const genreData = await fetchGenresFromDB()
      setGenres(genreData)

      // Load artists for each genre
      const artistMap = new Map<string, ArtistRow[]>()
      for (const genre of genreData) {
        const artists = await fetchArtistsByGenreFromDB(genre.id)
        artistMap.set(genre.id, artists)
      }
      setArtistsByGenre(artistMap)
    } catch (err) {
      console.error('[v0] Error loading genres:', err)
      setError('Error cargando datos de Supabase')
    } finally {
      setLoading(false)
    }
  }

  const handlePin = () => {
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true)
      setError('')
      setPinInput('')
    } else {
      setError('PIN incorrecto')
      setPinInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePin()
    }
  }

  // Genre operations
  const handleAddGenre = async () => {
    if (!newGenre.name || !newGenre.emoji) {
      setError('Por favor completa el nombre y emoji')
      return
    }

    setLoading(true)
    const result = await addGenre(newGenre.name, newGenre.emoji)
    if (result) {
      setSuccess('✅ Género agregado exitosamente')
      setNewGenre({ name: '', emoji: '' })
      await loadGenres()
    } else {
      setError('Error al agregar género')
    }
    setLoading(false)
  }

  const handleEditGenre = async () => {
    if (!editingGenre || !editingGenre.name || !editingGenre.emoji) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    const result = await updateGenre(editingGenre.id, editingGenre.name, editingGenre.emoji)
    if (result) {
      setSuccess('✅ Género actualizado exitosamente')
      setEditingGenre(null)
      await loadGenres()
    } else {
      setError('Error al actualizar género')
    }
    setLoading(false)
  }

  const handleDeleteGenre = async (genreId: string) => {
    if (!confirm('¿Estás seguro de eliminar este género y todos sus artistas?')) return

    setLoading(true)
    const result = await deleteGenre(genreId)
    if (result) {
      setSuccess('✅ Género eliminado exitosamente')
      await loadGenres()
    } else {
      setError('Error al eliminar género')
    }
    setLoading(false)
  }

  // Artist operations
  const handleAddArtist = async () => {
    if (!newArtist.genreId || !newArtist.name) {
      setError('Por favor completa el nombre del artista')
      return
    }

    setLoading(true)
    const result = await addArtist(newArtist.genreId, newArtist.name, newArtist.songs, newArtist.mp3Mb, newArtist.mp4Mb)
    if (result) {
      setSuccess('✅ Artista agregado exitosamente')
      setNewArtist({ genreId: '', name: '', songs: 0, mp3Mb: 0, mp4Mb: 0 })
      await loadGenres()
    } else {
      setError('Error al agregar artista')
    }
    setLoading(false)
  }

  const handleEditArtist = async () => {
    if (!editingArtist || !editingArtist.name) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    const result = await updateArtist(editingArtist.id, editingArtist.name, editingArtist.songs, editingArtist.mp3Mb, editingArtist.mp4Mb)
    if (result) {
      setSuccess('✅ Artista actualizado exitosamente')
      setEditingArtist(null)
      await loadGenres()
    } else {
      setError('Error al actualizar artista')
    }
    setLoading(false)
  }

  const handleDeleteArtist = async (artistId: string) => {
    if (!confirm('¿Estás seguro de eliminar este artista?')) return

    setLoading(true)
    const result = await deleteArtist(artistId)
    if (result) {
      setSuccess('✅ Artista eliminado exitosamente')
      await loadGenres()
    } else {
      setError('Error al eliminar artista')
    }
    setLoading(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] rounded-3xl p-8 max-w-sm w-full border border-white/10">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600/20 mx-auto mb-4">
            <Lock className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Panel Administrativo</h2>
          <p className="text-[#888] text-center text-sm mb-6">Ingresa el PIN para acceder</p>

          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="PIN"
            className="w-full px-4 py-3 bg-[#222] border border-white/10 rounded-lg focus:outline-none focus:border-red-500 text-center tracking-widest mb-4"
          />

          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-200 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handlePin}
            className="w-full px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition"
          >
            Acceder
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg text-[#888] hover:text-white transition mt-3"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1a1a] rounded-3xl p-8 max-w-3xl w-full border border-white/10 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Panel de Administrador</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#222] rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 mb-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 mb-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-200">{success}</p>
          </div>
        )}

        {/* Edit Genre Form */}
        {editingGenre && (
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3 text-blue-300">Editando: {editingGenre.name}</h3>
            <div className="grid gap-3">
              <input
                type="text"
                value={editingGenre.emoji}
                onChange={(e) => setEditingGenre({ ...editingGenre, emoji: e.target.value })}
                placeholder="Emoji"
                maxLength={2}
                className="px-3 py-2 bg-[#222] border border-white/10 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={editingGenre.name}
                onChange={(e) => setEditingGenre({ ...editingGenre, name: e.target.value })}
                placeholder="Nombre del género"
                className="px-3 py-2 bg-[#222] border border-white/10 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEditGenre}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={() => setEditingGenre(null)}
                  className="flex-1 px-3 py-2 bg-[#222] hover:bg-[#333] rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Artist Form */}
        {editingArtist && (
          <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3 text-purple-300">Editando artista: {editingArtist.name}</h3>
            <div className="grid gap-3">
              <input
                type="text"
                value={editingArtist.name}
                onChange={(e) => setEditingArtist({ ...editingArtist, name: e.target.value })}
                placeholder="Nombre del artista"
                className="px-3 py-2 bg-[#222] border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={editingArtist.songs}
                  onChange={(e) => setEditingArtist({ ...editingArtist, songs: parseInt(e.target.value) || 0 })}
                  placeholder="Canciones"
                  className="px-3 py-2 bg-[#222] border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <input
                  type="number"
                  value={editingArtist.mp3Mb}
                  onChange={(e) => setEditingArtist({ ...editingArtist, mp3Mb: parseInt(e.target.value) || 0 })}
                  placeholder="MB MP3"
                  className="px-3 py-2 bg-[#222] border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <input
                  type="number"
                  value={editingArtist.mp4Mb}
                  onChange={(e) => setEditingArtist({ ...editingArtist, mp4Mb: parseInt(e.target.value) || 0 })}
                  placeholder="MB MP4"
                  className="px-3 py-2 bg-[#222] border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditArtist}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={() => setEditingArtist(null)}
                  className="flex-1 px-3 py-2 bg-[#222] hover:bg-[#333] rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Genre Form */}
        <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3 text-green-300">Agregar Nuevo Género</h3>
          <div className="grid gap-3">
            <input
              type="text"
              value={newGenre.emoji}
              onChange={(e) => setNewGenre({ ...newGenre, emoji: e.target.value })}
              placeholder="Emoji"
              maxLength={2}
              className="px-3 py-2 bg-[#222] border border-white/10 rounded-lg focus:outline-none focus:border-green-500"
            />
            <input
              type="text"
              value={newGenre.name}
              onChange={(e) => setNewGenre({ ...newGenre, name: e.target.value })}
              placeholder="Nombre del género"
              className="px-3 py-2 bg-[#222] border border-white/10 rounded-lg focus:outline-none focus:border-green-500"
            />
            <button
              onClick={handleAddGenre}
              disabled={loading}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Agregar Género
            </button>
          </div>
        </div>

        {/* Genres List */}
        <div className="bg-[#222] rounded-2xl p-6 border border-white/10 mb-6">
          <h3 className="text-lg font-semibold mb-4">Géneros y Artistas ({genres.length})</h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {genres.map((genre) => {
              const genreArtists = artistsByGenre.get(genre.id) || []
              const isExpanded = expandedGenreId === genre.id
              const totalMb = genreArtists.reduce((sum, a) => sum + a.mp3_mb, 0)

              return (
                <div key={genre.id}>
                  <div className="bg-[#1c1c1c] rounded-lg p-3 border border-white/5 hover:border-white/10 transition">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setExpandedGenreId(isExpanded ? null : genre.id)}
                        className="flex-1 text-left flex items-center gap-2 hover:text-white transition"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <div>
                          <h4 className="font-semibold text-sm">
                            {genre.emoji} {genre.name}
                          </h4>
                          <p className="text-xs text-[#666]">
                            {genreArtists.length} artistas • {totalMb} MB (MP3)
                          </p>
                        </div>
                      </button>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => setEditingGenre({ id: genre.id, name: genre.name, emoji: genre.emoji })}
                          className="p-2 hover:bg-blue-600/20 rounded transition"
                        >
                          <Edit className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteGenre(genre.id)}
                          className="p-2 hover:bg-red-600/20 rounded transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Artists for this genre */}
                    {isExpanded && (
                      <div className="mt-4 ml-6 border-l border-white/10 pl-4 space-y-2">
                        {genreArtists.map((artist) => (
                          <div key={artist.id} className="bg-[#1a1a1a] rounded p-2 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{artist.name}</p>
                              <p className="text-xs text-[#666]">
                                {artist.songs} canciones • {artist.mp3_mb} MB MP3 • {artist.mp4_mb} MB MP4
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() =>
                                  setEditingArtist({
                                    id: artist.id,
                                    genreId: artist.genre_id,
                                    name: artist.name,
                                    songs: artist.songs,
                                    mp3Mb: artist.mp3_mb,
                                    mp4Mb: artist.mp4_mb,
                                  })
                                }
                                className="p-1.5 hover:bg-blue-600/20 rounded transition"
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteArtist(artist.id)}
                                className="p-1.5 hover:bg-red-600/20 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add Artist Form */}
                        <div className="bg-[#222] rounded p-2 border border-white/5">
                          <div className="grid grid-cols-5 gap-1 mb-2">
                            <input
                              type="text"
                              value={newArtist.genreId === genre.id ? newArtist.name : ''}
                              onChange={(e) => {
                                if (newArtist.genreId === genre.id) {
                                  setNewArtist({ ...newArtist, name: e.target.value })
                                }
                              }}
                              onFocus={() => setNewArtist({ ...newArtist, genreId: genre.id, name: newArtist.name })}
                              placeholder="Nombre"
                              className="col-span-2 px-2 py-1 bg-[#1a1a1a] border border-white/5 rounded text-xs focus:outline-none focus:border-green-500"
                            />
                            <input
                              type="number"
                              value={newArtist.genreId === genre.id ? newArtist.songs : 0}
                              onChange={(e) => {
                                if (newArtist.genreId === genre.id) {
                                  setNewArtist({ ...newArtist, songs: parseInt(e.target.value) || 0 })
                                }
                              }}
                              placeholder="Canc."
                              className="px-2 py-1 bg-[#1a1a1a] border border-white/5 rounded text-xs focus:outline-none focus:border-green-500"
                            />
                            <input
                              type="number"
                              value={newArtist.genreId === genre.id ? newArtist.mp3Mb : 0}
                              onChange={(e) => {
                                if (newArtist.genreId === genre.id) {
                                  setNewArtist({ ...newArtist, mp3Mb: parseInt(e.target.value) || 0 })
                                }
                              }}
                              placeholder="MP3"
                              className="px-2 py-1 bg-[#1a1a1a] border border-white/5 rounded text-xs focus:outline-none focus:border-green-500"
                            />
                            <input
                              type="number"
                              value={newArtist.genreId === genre.id ? newArtist.mp4Mb : 0}
                              onChange={(e) => {
                                if (newArtist.genreId === genre.id) {
                                  setNewArtist({ ...newArtist, mp4Mb: parseInt(e.target.value) || 0 })
                                }
                              }}
                              placeholder="MP4"
                              className="px-2 py-1 bg-[#1a1a1a] border border-white/5 rounded text-xs focus:outline-none focus:border-green-500"
                            />
                          </div>
                          <button
                            onClick={handleAddArtist}
                            disabled={loading || newArtist.genreId !== genre.id}
                            className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs font-semibold flex items-center justify-center gap-1 transition"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar artista
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-xl bg-[#222] text-[#ccc] font-semibold hover:bg-[#333] transition"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}
