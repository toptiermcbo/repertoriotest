import { supabase, GenreRow, ArtistRow } from './supabase-client'

// ========== GENRE OPERATIONS ==========

export async function addGenre(name: string, emoji: string): Promise<GenreRow | null> {
  if (!supabase) {
    console.error('[v0] Supabase not initialized')
    return null
  }

  const id = `genre-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const { data, error } = await supabase
      .from('genres')
      .insert({
        id,
        name,
        emoji,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error adding genre:', error)
      return null
    }

    console.log('[v0] Genre added successfully:', name)
    return data
  } catch (err) {
    console.error('[v0] Error adding genre:', err)
    return null
  }
}

export async function updateGenre(genreId: string, name: string, emoji: string): Promise<GenreRow | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('genres')
      .update({ name, emoji })
      .eq('id', genreId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating genre:', error)
      return null
    }

    console.log('[v0] Genre updated successfully:', name)
    return data
  } catch (err) {
    console.error('[v0] Error updating genre:', err)
    return null
  }
}

export async function deleteGenre(genreId: string): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase.from('genres').delete().eq('id', genreId)

    if (error) {
      console.error('[v0] Error deleting genre:', error)
      return false
    }

    console.log('[v0] Genre deleted successfully')
    return true
  } catch (err) {
    console.error('[v0] Error deleting genre:', err)
    return false
  }
}

// ========== ARTIST OPERATIONS ==========

export async function addArtist(
  genreId: string,
  name: string,
  songs: number,
  mp3Mb: number,
  mp4Mb: number
): Promise<ArtistRow | null> {
  if (!supabase) return null

  const id = `artist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const { data, error } = await supabase
      .from('artists')
      .insert({
        id,
        genre_id: genreId,
        name,
        songs,
        mp3_mb: mp3Mb,
        mp4_mb: mp4Mb,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error adding artist:', error)
      return null
    }

    console.log('[v0] Artist added successfully:', name)
    return data
  } catch (err) {
    console.error('[v0] Error adding artist:', err)
    return null
  }
}

export async function updateArtist(
  artistId: string,
  name: string,
  songs: number,
  mp3Mb: number,
  mp4Mb: number
): Promise<ArtistRow | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('artists')
      .update({
        name,
        songs,
        mp3_mb: mp3Mb,
        mp4_mb: mp4Mb,
      })
      .eq('id', artistId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating artist:', error)
      return null
    }

    console.log('[v0] Artist updated successfully:', name)
    return data
  } catch (err) {
    console.error('[v0] Error updating artist:', err)
    return null
  }
}

export async function deleteArtist(artistId: string): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase.from('artists').delete().eq('id', artistId)

    if (error) {
      console.error('[v0] Error deleting artist:', error)
      return false
    }

    console.log('[v0] Artist deleted successfully')
    return true
  } catch (err) {
    console.error('[v0] Error deleting artist:', err)
    return false
  }
}
