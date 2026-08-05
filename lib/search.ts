import { GENRES, type Genre } from './genres'

// Crear índices de búsqueda
interface SearchableItem {
  id: string
  type: 'genre' | 'artist'
  name: string
  genreId?: string
  genreName?: string
  displayText: string
}

function buildSearchIndex(): SearchableItem[] {
  const items: SearchableItem[] = []

  // Indexar géneros
  GENRES.forEach(genre => {
    items.push({
      id: genre.id,
      type: 'genre',
      name: genre.name,
      displayText: genre.name,
    })

    // Indexar artistas
    genre.artistList.forEach(artist => {
      items.push({
        id: `${genre.id}::${artist.name}`,
        type: 'artist',
        name: artist.name,
        genreId: genre.id,
        genreName: genre.name,
        displayText: `${artist.name} • ${genre.name}`,
      })
    })
  })

  return items
}

const searchIndex = buildSearchIndex()

// Función para normalizar texto: minúsculas y sin tildes
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export interface SearchResult {
  item: SearchableItem
  score: number
}

// Búsqueda inteligente por palabras individuales
export function fuzzySearch(query: string): SearchResult[] {
  if (!query.trim()) return []

  // Dividir la búsqueda en palabras individuales
  const searchWords = normalizeText(query)
    .split(/\s+/)
    .filter((word) => word.length > 0)

  if (searchWords.length === 0) return []

  // Filtrar resultados: el artista/género debe contener al menos una de las palabras
  const matchedItems = searchIndex
    .map((item) => {
      const normalizedName = normalizeText(item.name)
      const normalizedGenre = normalizeText(item.genreName || '')
      const searchText = `${normalizedName} ${normalizedGenre}`

      // Contar cuántas palabras coinciden
      const matchCount = searchWords.filter((word) =>
        searchText.includes(word)
      ).length

      // Si hay al menos una coincidencia, incluir el resultado
      if (matchCount > 0) {
        return {
          item,
          score: matchCount / searchWords.length, // Score basado en coincidencias
        }
      }

      return null
    })
    .filter((result): result is SearchResult => result !== null)
    // Ordenar por relevancia (más coincidencias primero)
    .sort((a, b) => b.score - a.score)

  return matchedItems
}

// Obtener resultados agrupados por tipo
export function getGroupedSearchResults(query: string) {
  const results = fuzzySearch(query)

  const genres: SearchableItem[] = []
  const artists: SearchableItem[] = []

  results.forEach((result) => {
    if (result.item.type === 'genre') {
      genres.push(result.item)
    } else {
      artists.push(result.item)
    }
  })

  return { genres, artists }
}

// Re-exportar el buildSearchIndex para actualizar en el admin
export { buildSearchIndex }
