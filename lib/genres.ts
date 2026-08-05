// genres.ts — derives the Genre[] shape used by UI components
// from the master catalog in catalogo.ts.
//
// The UI only needs: id, name, emoji, artists count, and total
// sizes per format. These are computed by summing artist-level data.

import { CATALOGO, type GenreEntry, type Artist } from './catalogo'

export type { Artist, GenreEntry }

export interface Genre {
  id: string
  name: string
  emoji: string
  artists: number            // total number of artist entries
  totalSizeMb: { mp3: number; mp4: number }  // sum of all artists' sizes
  artistList: Artist[]       // full artist list for detail/search
}

export const GENRES: Genre[] = CATALOGO
  .map((entry) => {
    const mp3 = entry.artists.reduce((acc, a) => acc + a.mp3Mb, 0)
    const mp4 = entry.artists.reduce((acc, a) => acc + a.mp4Mb, 0)
    return {
      id: entry.id,
      name: entry.name,
      emoji: entry.emoji,
      artists: entry.artists.length,
      totalSizeMb: { mp3, mp4 },
      artistList: [...entry.artists].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      ),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
