import { reactive, watch } from 'vue'

const STORAGE_KEY = 'otaku-shelf-library'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Each entry shape:
// {
//   id: string (mal_id or uuid),
//   title: string,
//   titleFr: string,
//   coverUrl: string,
//   synopsis: string,
//   animeEpisodes: number,         // total episodes (0 = unknown)
//   animeWatched: number,          // episodes watched
//   mangaVolumes: number,          // total volumes (0 = unknown)
//   ownedVolumes: number[],        // array of owned volume numbers
//   status: 'watching'|'completed'|'plan'|'dropped',
//   score: number|null,            // 1-10
//   notes: string,
//   type: 'anime'|'manga'|'both',
//   addedAt: string (ISO date)
// }

export const library = reactive(loadFromStorage())

watch(library, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

export function addSeries(series) {
  const exists = library.find(s => s.id === series.id)
  if (!exists) library.push({ ...series, addedAt: new Date().toISOString() })
}

export function updateSeries(id, patch) {
  const idx = library.findIndex(s => s.id === id)
  if (idx !== -1) Object.assign(library[idx], patch)
}

export function removeSeries(id) {
  const idx = library.findIndex(s => s.id === id)
  if (idx !== -1) library.splice(idx, 1)
}

export function toggleOwnedVolume(id, volumeNumber) {
  const entry = library.find(s => s.id === id)
  if (!entry) return
  if (!entry.ownedVolumes) entry.ownedVolumes = []
  const i = entry.ownedVolumes.indexOf(volumeNumber)
  if (i === -1) entry.ownedVolumes.push(volumeNumber)
  else entry.ownedVolumes.splice(i, 1)
}

export function addVolumeByIsbn(seriesId, volumeNumber) {
  const entry = library.find(s => s.id === seriesId)
  if (!entry) return false
  if (!entry.ownedVolumes) entry.ownedVolumes = []
  if (!entry.ownedVolumes.includes(volumeNumber)) {
    entry.ownedVolumes.push(volumeNumber)
    entry.ownedVolumes.sort((a, b) => a - b)
  }
  return true
}

export const STATUS_LABELS = {
  watching: 'En cours',
  completed: 'Terminé',
  plan: 'Prévu',
  dropped: 'Abandonné'
}
