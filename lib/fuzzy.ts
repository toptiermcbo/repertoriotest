/**
 * Fuzzy search utility with:
 * - Diacritic / accent normalization (café → cafe, Ángel → angel)
 * - Case-insensitive matching
 * - Partial token matching  (every query word must appear somewhere in the target)
 * - Trigram similarity scoring for typo tolerance
 *   ("vengho" ↔ "Van Gogh", "anuel" ↔ "Anuel AA")
 */

/** Strip accents/diacritics and lowercase */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Build a multiset of all 3-character substrings */
function trigrams(s: string): Map<string, number> {
  const padded = `  ${s}  `
  const map = new Map<string, number>()
  for (let i = 0; i < padded.length - 2; i++) {
    const tri = padded.slice(i, i + 3)
    map.set(tri, (map.get(tri) ?? 0) + 1)
  }
  return map
}

/**
 * Dice coefficient using trigrams – returns 0..1
 * 1.0 = identical, ~0.5+ = very similar
 */
function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(a)
  const tb = trigrams(b)
  let intersection = 0
  ta.forEach((count, key) => {
    const bCount = tb.get(key) ?? 0
    intersection += Math.min(count, bCount)
  })
  const total = [...ta.values()].reduce((s, v) => s + v, 0) +
                [...tb.values()].reduce((s, v) => s + v, 0)
  return total === 0 ? 0 : (2 * intersection) / total
}

/**
 * Score a query against a target string.
 * Returns a value > 0 if the query is a plausible match.
 *
 * Strategy (descending priority):
 * 1. Exact substring match            → score 1.0
 * 2. All query tokens present as substrings → score 0.8+
 * 3. High trigram similarity per token → score 0.4+
 */
export function fuzzyScore(query: string, target: string): number {
  const q = normalize(query)
  const t = normalize(target)

  if (!q) return 1 // empty query matches everything

  // 1. Direct substring
  if (t.includes(q)) return 1.0

  const qTokens = q.split(/\s+/).filter(Boolean)
  const tTokens = t.split(/\s+/).filter(Boolean)

  // 2. All query tokens are substrings of the whole target
  const allSubstring = qTokens.every((qt) => t.includes(qt))
  if (allSubstring) return 0.85

  // 3. Per-token fuzzy matching — each query token must match at least
  //    one target token well enough (either as substring or by trigram score)
  const TRIGRAM_THRESHOLD = 0.30 // more generous: catches even more typos like "vengho"↔"vangho"

  let totalScore = 0
  let matchedTokens = 0

  for (const qt of qTokens) {
    // Try to find the best-matching target token for this query token
    let best = 0

    // Substring in whole target? Short tokens (≤3 chars) must match exactly
    if (t.includes(qt)) {
      best = qt.length <= 2 ? 1.0 : 0.8
    } else {
      // Trigram similarity against each target token
      for (const tt of tTokens) {
        const sim = trigramSimilarity(qt, tt)
        if (sim > best) best = sim
      }
      // Also compare query token against full target string
      const simFull = trigramSimilarity(qt, t)
      if (simFull > best) best = simFull
    }

    if (best >= TRIGRAM_THRESHOLD) {
      totalScore += best
      matchedTokens++
    }
  }

  // All query tokens must have a match
  if (matchedTokens < qTokens.length) return 0

  return totalScore / qTokens.length
}

export interface SearchResult<T> {
  item: T
  score: number
}

/** Filter and rank a list by fuzzy score, returning items above the threshold */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  threshold = 0.30
): SearchResult<T>[] {
  if (!query.trim()) return items.map((item) => ({ item, score: 1 }))

  return items
    .map((item) => ({ item, score: fuzzyScore(query, getText(item)) }))
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
}
