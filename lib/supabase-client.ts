import { createClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (typeof window === 'undefined') {
    // Server-side: create a temporary instance
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.warn('[v0] Supabase not configured on server')
      return null
    }
    return createClient(url, key)
  }

  // Client-side: cache the instance
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.warn('[v0] Missing Supabase environment variables')
      return null
    }
    supabaseInstance = createClient(url, key)
  }

  return supabaseInstance
}

export const supabase = getSupabase()

// Type definitions for our tables
export interface GenreRow {
  id: string
  name: string
  emoji: string
  created_at: string
  updated_at: string
}

export interface ArtistRow {
  id: string
  genre_id: string
  name: string
  songs: number
  mp3_mb: number
  mp4_mb: number
  created_at: string
  updated_at: string
}

// Fetch all genres from Supabase
export async function fetchGenresFromDB(): Promise<GenreRow[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching genres:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[v0] Error fetching genres:', err)
    return []
  }
}

// Fetch all artists for a specific genre
export async function fetchArtistsByGenreFromDB(genreId: string): Promise<ArtistRow[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('genre_id', genreId)
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching artists:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[v0] Error fetching artists:', err)
    return []
  }
}

// Fetch all artists
export async function fetchAllArtistsFromDB(): Promise<ArtistRow[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching all artists:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[v0] Error fetching all artists:', err)
    return []
  }
}
