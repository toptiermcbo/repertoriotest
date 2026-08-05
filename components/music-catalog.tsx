'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Search, Music, ArrowLeft, Check, X } from 'lucide-react'
import { GENRES, type Genre } from '@/lib/genres'
import { fuzzyFilter, fuzzyScore } from '@/lib/fuzzy'
import { GenreCard } from './genre-card'
import { ArtistCard } from './artist-card'
import { BottomBar } from './bottom-bar'
import { useSupabaseCatalog } from '@/hooks/useSupabaseCatalog'

type Format = 'mp3' | 'mp4'
type PendriveSize = '16' | '32' | '64' | '128'
type ArtistKey = string

interface MusicCatalogProps {
  format: Format
  onChangeFormat: () => void
}

const WHATSAPP_NUMBER = '584226579577'

function formatSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${Math.round(mb)} MB`
}

// ─── Flat search result item ──────────────────────────────────────────────────
interface ArtistResult {
  artistName: string
  mp3Mb: number
  mp4Mb: number
  songs: number
  genreId: string
  genreName: string
  genreEmoji: string
  score: number
}

function buildArtistResults(query: string, genres: Genre[]): ArtistResult[] {
  if (!query.trim()) return []
  const results: ArtistResult[] = []
  const sortedGenres = [...genres].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  )

  for (const genre of sortedGenres) {
    for (const artist of genre.artistList) {
      const score = fuzzyScore(query, artist.name)
      if (score >= 0.30) {
        results.push({
          artistName: artist.name,
          mp3Mb: artist.mp3Mb,
          mp4Mb: artist.mp4Mb,
          songs: artist.songs,
          genreId: genre.id,
          genreName: genre.name,
          genreEmoji: genre.emoji,
          score,
        })
      }
    }
  }
  // Sort by score desc, then artist name
  return results.sort((a, b) => b.score - a.score || a.artistName.localeCompare(b.artistName, 'es'))
}

export function MusicCatalog({ format, onChangeFormat }: MusicCatalogProps) {
  // Load catalog from Supabase (with fallback to local)
  const { genres: supabaseGenres, loading: genresLoading } = useSupabaseCatalog()
  const genres = supabaseGenres.length > 0 ? supabaseGenres : GENRES
  const SORTED_GENRES = [...genres].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  )

  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [pendriveSize, setPendriveSize] = useState<PendriveSize | null>(null)
  const [activeGenreId, setActiveGenreId] = useState<string | null>(null)
  const [selectedArtists, setSelectedArtists] = useState<Set<ArtistKey>>(new Set())
  const [undoStack, setUndoStack] = useState<Set<ArtistKey>[]>([])

  // Scroll al principio cuando se selecciona un género
  useEffect(() => {
    if (activeGenreId) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeGenreId])

  const pushUndo = useCallback((prev: Set<ArtistKey>) => {
    setUndoStack((stack) => [...stack.slice(-19), new Set(prev)])
  }, [])

  const handleUndo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack
      const prev = stack[stack.length - 1]
      setSelectedArtists(new Set(prev))
      return stack.slice(0, -1)
    })
  }, [])

  const activeGenre: Genre | null = useMemo(
    () => SORTED_GENRES.find((g) => g.id === activeGenreId) ?? null,
    [activeGenreId, SORTED_GENRES]
  )

  const sortedArtists = useMemo(() => {
    if (!activeGenre) return []
    return [...activeGenre.artistList].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    )
  }, [activeGenre])

  // Search results across all artists (flat)
  const searchResults = useMemo(
    () => buildArtistResults(search, SORTED_GENRES),
    [search, SORTED_GENRES]
  )

  // Matched genres for header count
  const matchedGenreIds = useMemo(() => {
    if (!search.trim()) return new Set<string>()
    return new Set(searchResults.map((r) => r.genreId))
  }, [search, searchResults])

  // Filtered genre list (for when no search active)
  const filteredGenres = useMemo(() => {
    if (!search.trim()) return SORTED_GENRES
    return SORTED_GENRES.filter((g) => {
      if (fuzzyScore(search, g.name) >= 0.30) return true
      return g.artistList.some((a) => fuzzyScore(search, a.name) >= 0.30)
    })
  }, [search])

  // Filter artists inside the drill-down view
  const filteredArtists = useMemo(() => {
    if (!activeGenre) return []
    if (!search.trim()) return sortedArtists
    return fuzzyFilter(sortedArtists, search, (a) => a.name).map((r) => r.item)
  }, [activeGenre, sortedArtists, search])

  const activeSelected = useMemo(() => {
    if (!activeGenreId) return new Set<string>()
    return new Set(
      Array.from(selectedArtists).filter((k) => k.startsWith(`${activeGenreId}::`))
    )
  }, [selectedArtists, activeGenreId])

  const toggleArtist = useCallback(
    (artistName: string, genreIdOverride?: string) => {
      const gId = genreIdOverride ?? activeGenreId
      if (!gId) return
      const key: ArtistKey = `${gId}::${artistName}`
      setSelectedArtists((prev) => {
        pushUndo(prev)
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
    [activeGenreId, pushUndo]
  )

  const selectAll = useCallback(() => {
    if (!activeGenre) return
    setSelectedArtists((prev) => {
      pushUndo(prev)
      const next = new Set(prev)
      activeGenre.artistList.forEach((a) => next.add(`${activeGenre.id}::${a.name}`))
      return next
    })
  }, [activeGenre, pushUndo])

  const deselectAll = useCallback(() => {
    if (!activeGenre) return
    setSelectedArtists((prev) => {
      pushUndo(prev)
      const next = new Set(prev)
      activeGenre.artistList.forEach((a) => next.delete(`${activeGenre.id}::${a.name}`))
      return next
    })
  }, [activeGenre, pushUndo])

  const clearAll = useCallback(() => {
    pushUndo(selectedArtists)
    setSelectedArtists(new Set())
  }, [selectedArtists, pushUndo])

  const totalMb = useMemo(() => {
    return Array.from(selectedArtists).reduce((acc, key) => {
      const [genreId, artistName] = key.split('::')
      const genre = GENRES.find((g) => g.id === genreId)
      const artist = genre?.artistList.find((a) => a.name === artistName)
      if (!artist) return acc
      return acc + (format === 'mp3' ? artist.mp3Mb : artist.mp4Mb)
    }, 0)
  }, [selectedArtists, format])

  const genreSelectionState = useCallback(
    (genreId: string): 'none' | 'partial' | 'full' => {
      const genre = GENRES.find((g) => g.id === genreId)
      if (!genre) return 'none'
      const count = genre.artistList.filter((a) =>
        selectedArtists.has(`${genreId}::${a.name}`)
      ).length
      if (count === 0) return 'none'
      if (count === genre.artistList.length) return 'full'
      return 'partial'
    },
    [selectedArtists]
  )

  const genreSelectedCount = useCallback(
    (genreId: string): number => {
      const genre = GENRES.find((g) => g.id === genreId)
      if (!genre) return 0
      return genre.artistList.filter((a) =>
        selectedArtists.has(`${genreId}::${a.name}`)
      ).length
    },
    [selectedArtists]
  )

  // All selected artists as chips (for global chips panel in genre list view)
  const allSelectedChips = useMemo(() => {
    const chips: { key: ArtistKey; artistName: string; genreName: string; sizeMb: number }[] = []
    selectedArtists.forEach((key) => {
      const [genreId, artistName] = key.split('::')
      const genre = GENRES.find((g) => g.id === genreId)
      const artist = genre?.artistList.find((a) => a.name === artistName)
      if (!artist || !genre) return
      chips.push({
        key,
        artistName,
        genreName: genre.name,
        sizeMb: format === 'mp3' ? artist.mp3Mb : artist.mp4Mb,
      })
    })
    return chips.sort((a, b) => a.artistName.localeCompare(b.artistName, 'es'))
  }, [selectedArtists, format])

  // Active genre chips
  const activeChips = useMemo(() => {
    if (!activeGenre) return []
    return sortedArtists.filter((a) => selectedArtists.has(`${activeGenre.id}::${a.name}`))
  }, [activeGenre, sortedArtists, selectedArtists])

  const removeChip = useCallback((key: ArtistKey) => {
    setSelectedArtists((prev) => {
      pushUndo(prev)
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [pushUndo])

  const sendWhatsApp = () => {
    // Validar que nombre y pendrive sean obligatorios
    if (!name.trim()) {
      alert('Por favor, ingresa tu nombre')
      return
    }
    if (!pendriveSize) {
      alert('Por favor, selecciona un pendrive')
      return
    }

    const byGenre = new Map<string, { name: string; mb: number }[]>()
    selectedArtists.forEach((key) => {
      const [genreId, artistName] = key.split('::')
      const genre = GENRES.find((g) => g.id === genreId)
      const artist = genre?.artistList.find((a) => a.name === artistName)
      if (!artist) return
      if (!byGenre.has(genreId)) byGenre.set(genreId, [])
      byGenre.get(genreId)!.push({
        name: artistName,
        mb: format === 'mp3' ? artist.mp3Mb : artist.mp4Mb,
      })
    })

    // Construir mensaje formateado nuevo
    const now = new Date()
    const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })

    const genreLines = Array.from(byGenre.entries())
      .map(([genreId, artists]) => {
        const genre = GENRES.find((g) => g.id === genreId)
        const totalMb = artists.reduce((acc, a) => acc + a.mb, 0)
        const artistLines = artists.map((a) => `  • ${a.name} (${formatSize(a.mb)})`).join('\n')
        return `🎤 ${genre?.name ?? genreId}\n${artistLines}`
      })
      .join('\n\n')

    const limitText = `${pendriveSize} GB`
    const totalGbFormatted = (totalMb / 1024).toFixed(2)

    const message = [
      `🎵 PEDIDO DE REPERTORIO MUSICAL`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 Cliente: ${name}`,
      `🎵 Formato: ${format.toUpperCase()}`,
      `📅 Fecha: ${dateStr}, ${timeStr}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `🎤 Artistas seleccionados:`,
      ``,
      genreLines,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🎤 Total artistas: ${selectedArtists.size}`,
      `💾 Peso total: ${Math.round(totalMb)} MB (${totalGbFormatted} GB)`,
      `🖥️ Pendrive sugerido: ${limitText} (elegido por cliente)`,
      `━━━━━━━━━━━━━━━━━━━━`,
    ]
      .join('\n')

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const allActiveSelected =
    activeGenre !== null && activeChips.length === activeGenre.artistList.length

  const isSearching = search.trim().length > 0

  // ─── Shared header ────────────────────────────────────────────────────────
  const Header = () => (
    <div className="flex flex-col items-center pt-8 pb-5 px-4 text-center">
      <Image
        src="/logo-toptier.png"
        alt="Top Tier Maracaibo"
        width={100}
        height={100}
        className="object-contain mb-3 drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}
      />
      <h1 className="text-2xl font-bold text-white mb-3">Repertorio Musical</h1>
      <button
        onClick={onChangeFormat}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-900/40 border border-red-800/50 text-xs font-medium text-red-300 hover:bg-red-900/60 transition-colors cursor-pointer mb-3"
      >
        <Music className="w-3 h-3" />
        {format.toUpperCase()} · <span className="underline">Cambiar</span>
      </button>
      <p className="text-[#888] text-sm max-w-sm leading-relaxed">
        Elige los géneros y los artistas que quieres. Y envíanos el pedido por WhatsApp.
      </p>
    </div>
  )

  // ─── ARTIST DRILL-DOWN VIEW ───────────────────────────────────────────────
  if (activeGenre) {
    return (
      <div
        className="min-h-screen pb-64"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(180,20,20,0.18) 0%, #111111 60%)' }}
      >
        <Header />
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#666]">
            <button
              onClick={() => { setActiveGenreId(null); setSearch('') }}
              className="flex items-center gap-1 hover:text-[#aaa] transition-colors cursor-pointer"
            >
              <Music className="w-3.5 h-3.5" />
              Géneros
            </button>
            <span>/</span>
            <span className="text-white font-medium flex items-center gap-1">
              {activeGenre.emoji} {activeGenre.name}
            </span>
          </div>

          {/* Selected chips for this genre */}
          {activeChips.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-[#1a1a1a] p-3">
              <p className="text-[10px] uppercase tracking-widest text-[#555] mb-2">Seleccionado</p>
              <div className="flex flex-wrap gap-2">
                {activeChips.map((artist) => {
                  const sizeMb = format === 'mp3' ? artist.mp3Mb : artist.mp4Mb
                  return (
                    <span key={artist.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2a2a2a] border border-white/10 text-xs text-white">
                      <span className="font-medium">{artist.name}</span>
                      <span className="text-[#888]">{formatSize(sizeMb)}</span>
                      <button
                        onClick={() => toggleArtist(artist.name)}
                        className="text-[#666] hover:text-white transition-colors cursor-pointer ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Artist search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar en ${activeGenre.name}...`}
              className="w-full bg-[#1a1a1a] border border-white/8 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-[#555] focus:outline-none focus:border-white/20 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Genre header bar */}
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#1a1a1a] px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setActiveGenreId(null); setSearch('') }}
                className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors cursor-pointer border border-white/10 rounded-lg px-2.5 py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Géneros
              </button>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#aaa]">
                {activeGenre.emoji} {activeGenre.name} —{' '}
                {search.trim() ? `${filteredArtists.length} de ${activeGenre.artists}` : `${activeGenre.artists}`} artistas
              </span>
            </div>
            <button
              onClick={allActiveSelected ? deselectAll : selectAll}
              className="flex items-center gap-1.5 text-xs font-medium text-[#aaa] hover:text-white transition-colors cursor-pointer border border-white/10 rounded-lg px-2.5 py-1"
            >
              {allActiveSelected ? (
                <><X className="w-3.5 h-3.5" /> Deseleccionar</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> Seleccionar todos</>
              )}
            </button>
          </div>

          {/* Artist grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {filteredArtists.map((artist) => (
              <ArtistCard
                key={artist.name}
                artist={artist}
                selected={activeSelected.has(`${activeGenreId}::${artist.name}`)}
                format={format}
                genreEmoji={activeGenre.emoji}
                onToggle={toggleArtist}
              />
            ))}
          </div>

          {filteredArtists.length === 0 && search.trim() && (
            <div className="flex flex-col items-center justify-center py-12 text-[#555]">
              <Search className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm">No se encontraron artistas para &quot;{search}&quot;</p>
            </div>
          )}
        </div>

        <BottomBar
          selectedCount={selectedArtists.size}
          totalMb={totalMb}
          pendriveSize={pendriveSize}
          onPendriveChange={setPendriveSize}
          onClear={clearAll}
          onUndo={handleUndo}
          canUndo={undoStack.length > 0}
          onWhatsApp={sendWhatsApp}
        />
      </div>
    )
  }

  // ─── GENRE LIST VIEW ──────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen pb-52"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(180,20,20,0.18) 0%, #111111 60%)' }}
    >
      <Header />

      <div className="max-w-3xl mx-auto px-4 space-y-4">
        {/* Name input */}
        <div className="rounded-2xl border border-white/8 bg-[#1a1a1a] p-4">
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#555] mb-3">
            Tu nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Carlos Martínez"
            className="w-full bg-[#242424] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar artista o género en todo el repertorio..."
            className="w-full bg-[#1a1a1a] border border-white/8 rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder-[#555] focus:outline-none focus:border-white/20 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── SEARCH RESULTS PANEL ─────────────────────────────────────── */}
        {isSearching ? (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-[#555]">
              Resultados para &quot;{search}&quot; — {matchedGenreIds.size} género(s), {searchResults.length} artista(s)
            </p>

            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#555]">
                <Search className="w-8 h-8 mb-3 opacity-40" />
                <p className="text-sm">No se encontraron resultados para &quot;{search}&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {searchResults.map((result) => {
                  const key = `${result.genreId}::${result.artistName}`
                  const isSelected = selectedArtists.has(key)
                  const sizeMb = format === 'mp3' ? result.mp3Mb : result.mp4Mb
                  return (
                    <button
                      key={key}
                      onClick={() => toggleArtist(result.artistName, result.genreId)}
                      className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-150 cursor-pointer w-full
                        ${isSelected
                          ? 'border-red-600/70 bg-red-950/30 ring-1 ring-red-600/40'
                          : 'border-white/8 bg-[#1c1c1c] hover:bg-[#222] hover:border-white/15'
                        }`}
                    >
                      {/* Emoji badge */}
                      <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#2a2a2a] border border-white/10 text-xl">
                        {result.genreEmoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-[#ccc]'}`}>
                          {result.artistName}
                        </p>
                        <p className="text-[11px] text-[#666] truncate">
                          {result.genreName}
                        </p>
                        <p className="text-[11px] text-[#555]">{formatSize(sizeMb)}</p>
                      </div>
                      {isSelected && (
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-600">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── NORMAL GENRE VIEW ──────────────────────────────────────── */
          <div className="space-y-4">
            {/* Global selected chips */}
            {allSelectedChips.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-[#1a1a1a] p-3">
                <p className="text-[10px] uppercase tracking-widest text-[#555] mb-2">Seleccionado</p>
                <div className="flex flex-wrap gap-2">
                  {allSelectedChips.map((chip) => (
                    <span key={chip.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2a2a2a] border border-white/10 text-xs text-white">
                      <span className="font-medium">{chip.artistName}</span>
                      <span className="text-[#888]">{formatSize(chip.sizeMb)}</span>
                      <button
                        onClick={() => removeChip(chip.key)}
                        className="text-[#666] hover:text-white transition-colors cursor-pointer ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Genres header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Music className="w-4 h-4 text-[#666]" />
                <span className="text-white font-semibold text-sm">Géneros</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#555] mb-3">
                {filteredGenres.length} géneros disponibles
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredGenres.map((genre) => {
                  const state = genreSelectionState(genre.id)
                  const count = genreSelectedCount(genre.id)
                  return (
                    <GenreCard
                      key={genre.id}
                      genre={genre}
                      selectionState={state}
                      selectedCount={count}
                      format={format}
                      onOpen={() => { setActiveGenreId(genre.id); setSearch('') }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomBar
        selectedCount={selectedArtists.size}
        totalMb={totalMb}
        pendriveSize={pendriveSize}
        onPendriveChange={setPendriveSize}
        onClear={clearAll}
        onUndo={handleUndo}
        canUndo={undoStack.length > 0}
        onWhatsApp={sendWhatsApp}
      />
    </div>
  )
}
