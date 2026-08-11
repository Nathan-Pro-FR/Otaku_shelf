import { ref } from 'vue'

const BASE = 'https://api.jikan.moe/v4'

// Jikan has a rate limit of 3 req/s — simple queue
let lastCall = 0
async function rateLimitedFetch(url) {
  const now = Date.now()
  const wait = Math.max(0, 350 - (now - lastCall))
  await new Promise(r => setTimeout(r, wait))
  lastCall = Date.now()
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Jikan error ${res.status}`)
  return res.json()
}

export function useJikan() {
  const results = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function searchAnime(query) {
    if (!query.trim()) return
    loading.value = true
    error.value = null
    try {
      const data = await rateLimitedFetch(`${BASE}/anime?q=${encodeURIComponent(query)}&limit=15&sfw=true`)
      results.value = data.data.map(mapAnime)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function searchManga(query) {
    if (!query.trim()) return
    loading.value = true
    error.value = null
    try {
      const data = await rateLimitedFetch(`${BASE}/manga?q=${encodeURIComponent(query)}&limit=15&sfw=true`)
      results.value = data.data.map(mapManga)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function searchBoth(query) {
    if (!query.trim()) return
    loading.value = true
    error.value = null
    try {
      const [animeData, mangaData] = await Promise.allSettled([
        rateLimitedFetch(`${BASE}/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`),
        rateLimitedFetch(`${BASE}/manga?q=${encodeURIComponent(query)}&limit=8&sfw=true`)
      ])
      const animes = animeData.status === 'fulfilled' ? animeData.value.data.map(mapAnime) : []
      const mangas = mangaData.status === 'fulfilled' ? mangaData.value.data.map(mapManga) : []
      results.value = [...animes, ...mangas]
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { results, loading, error, searchAnime, searchManga, searchBoth }
}

function mapAnime(a) {
  return {
    id: `mal-anime-${a.mal_id}`,
    malId: a.mal_id,
    title: a.title_english || a.title,
    titleJp: a.title,
    coverUrl: a.images?.jpg?.image_url || '',
    synopsis: a.synopsis || '',
    animeEpisodes: a.episodes || 0,
    animeWatched: 0,
    mangaVolumes: 0,
    ownedVolumes: [],
    status: 'plan',
    score: null,
    notes: '',
    type: 'anime'
  }
}

function mapManga(m) {
  return {
    id: `mal-manga-${m.mal_id}`,
    malId: m.mal_id,
    title: m.title_english || m.title,
    titleJp: m.title,
    coverUrl: m.images?.jpg?.image_url || '',
    synopsis: m.synopsis || '',
    animeEpisodes: 0,
    animeWatched: 0,
    mangaVolumes: m.volumes || 0,
    ownedVolumes: [],
    status: 'plan',
    score: null,
    notes: '',
    type: 'manga'
  }
}
