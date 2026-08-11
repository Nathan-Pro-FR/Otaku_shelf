import { ref } from 'vue'

export function useGoogleBooks() {
  const result = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function lookupIsbn(isbn) {
    loading.value = true
    error.value = null
    result.value = null
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`
      )
      if (!res.ok) throw new Error(`Google Books error ${res.status}`)
      const data = await res.json()
      if (!data.items?.length) {
        error.value = 'Aucun résultat pour cet ISBN.'
        return null
      }
      const info = data.items[0].volumeInfo
      result.value = {
        isbn,
        title: info.title || '',
        authors: info.authors?.join(', ') || '',
        coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
        publisher: info.publisher || '',
        publishedDate: info.publishedDate || '',
        description: info.description || '',
        // Try to extract volume number from title (e.g. "Naruto T.7" → 7)
        volumeNumber: extractVolumeNumber(info.title)
      }
      return result.value
    } catch (e) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  return { result, loading, error, lookupIsbn }
}

function extractVolumeNumber(title) {
  if (!title) return null
  // Patterns: "Vol. 7", "T.7", "T07", "Volume 7", "tome 7", "#7"
  const patterns = [
    /\bvol(?:ume)?\.?\s*(\d+)/i,
    /\bt(?:ome)?\.?\s*0*(\d+)/i,
    /#\s*0*(\d+)/,
    /\b0*(\d+)\s*$/
  ]
  for (const re of patterns) {
    const m = title.match(re)
    if (m) return parseInt(m[1], 10)
  }
  return null
}
