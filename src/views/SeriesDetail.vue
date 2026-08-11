<template>
  <div class="view" v-if="series">
    <!-- Back + actions -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <button class="btn btn--secondary btn--sm" @click="$router.back()">← Retour</button>
      <button class="btn btn--sm" style="color:var(--accent);background:transparent;" @click="confirmDelete">🗑 Supprimer</button>
    </div>

    <!-- Hero -->
    <div class="hero-card card" style="margin-bottom:16px;">
      <div class="hero-bg" :style="series.coverUrl ? `background-image:url(${series.coverUrl})` : ''"></div>
      <div class="hero-content">
        <img v-if="series.coverUrl" :src="series.coverUrl" class="hero-cover" :alt="series.title" />
        <div v-else class="hero-cover hero-cover--placeholder">🎌</div>
        <div class="hero-info">
          <span class="badge" :class="`badge--${series.type}`">{{ TYPE_LABELS[series.type] }}</span>
          <h2 class="hero-title">{{ series.title }}</h2>
          <div style="font-size:12px;color:var(--text-muted)">Ajouté le {{ formatDate(series.addedAt) }}</div>
        </div>
      </div>
    </div>

    <!-- Synopsis -->
    <div v-if="series.synopsis" class="card" style="padding:14px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px;">SYNOPSIS</div>
      <p style="font-size:13px;line-height:1.6;" :class="{ truncated: !showFull }">{{ series.synopsis }}</p>
      <button v-if="series.synopsis.length > 200" @click="showFull = !showFull" style="font-size:13px;color:var(--accent);margin-top:6px;">
        {{ showFull ? 'Réduire' : 'Lire la suite' }}
      </button>
    </div>

    <!-- Quick edit card -->
    <div class="card" style="padding:14px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:12px;">PROGRESSION</div>

      <!-- Status -->
      <div class="form-group">
        <label class="form-label">Statut</label>
        <select v-model="editStatus" @change="save">
          <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>

      <!-- Anime episodes -->
      <div v-if="series.type !== 'manga'" style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label class="form-label" style="margin:0">📺 Épisodes vus</label>
          <span style="font-size:14px;font-weight:600;color:var(--accent)">{{ editWatched }} / {{ series.animeEpisodes || '?' }}</span>
        </div>
        <div class="progress-bar" style="height:6px;margin-bottom:8px;">
          <div class="progress-bar__fill progress-bar__fill--anime" :style="{ width: animePercent + '%' }"></div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn btn--secondary btn--sm" @click="editWatched = Math.max(0, editWatched - 1); save()">−</button>
          <input type="number" v-model.number="editWatched" min="0" :max="series.animeEpisodes || 9999" @change="save" style="flex:1;text-align:center;" />
          <button class="btn btn--secondary btn--sm" @click="editWatched = Math.min(series.animeEpisodes || 9999, editWatched + 1); save()">＋</button>
        </div>
      </div>

      <!-- Score -->
      <div class="form-group">
        <label class="form-label">Note personnelle</label>
        <div class="star-row">
          <button v-for="n in 10" :key="n" class="star-btn" @click="editScore = editScore === n ? null : n; save()">
            {{ editScore >= n ? '⭐' : '☆' }}
          </button>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-group">
        <label class="form-label">Avis</label>
        <textarea v-model="editNotes" rows="3" placeholder="Mes impressions…" @blur="save"></textarea>
      </div>
    </div>

    <!-- Manga volumes -->
    <div v-if="series.type !== 'anime'" class="card" style="padding:14px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:2px;">TOMES POSSÉDÉS</div>
          <div style="font-size:18px;font-weight:700;color:var(--gold)">
            {{ series.ownedVolumes?.length || 0 }} / {{ series.mangaVolumes || '?' }}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
          <button class="btn btn--sm btn--secondary" @click="showVolumeInput = !showVolumeInput">
            ＋ Ajouter
          </button>
          <RouterLink to="/scanner">
            <button class="btn btn--sm btn--primary">📷 Scanner</button>
          </RouterLink>
        </div>
      </div>

      <!-- Add volume manually -->
      <div v-if="showVolumeInput" style="display:flex;gap:8px;margin-bottom:12px;">
        <input type="number" v-model.number="newVolNum" min="1" placeholder="N° du tome" style="flex:1;" />
        <button class="btn btn--primary btn--sm" @click="addVolume">Ajouter</button>
        <button class="btn btn--secondary btn--sm" @click="showVolumeInput = false">✕</button>
      </div>

      <!-- Set total volumes -->
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;">
        <input
          type="number"
          v-model.number="editMangaVolumes"
          min="0"
          placeholder="Total tomes"
          @change="save"
          style="max-width:140px;"
        />
        <span style="font-size:13px;color:var(--text-muted);">tomes au total</span>
      </div>

      <!-- Volume grid -->
      <div class="vol-grid" v-if="gridSize > 0">
        <button
          v-for="n in gridSize" :key="n"
          class="vol-chip"
          :class="{ owned: isOwned(n) }"
          @click="toggleVol(n)"
        >{{ n }}</button>
      </div>

      <!-- Missing list -->
      <div v-if="missingVolumes.length" style="margin-top:14px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px;">MANQUANTS</div>
        <div style="font-size:13px;color:var(--accent);">
          Tomes {{ missingVolumes.join(', ') }}
        </div>
      </div>
    </div>
  </div>

  <!-- 404 -->
  <div class="view" v-else>
    <div class="empty">
      <div class="empty__icon">🔍</div>
      <div class="empty__title">Série introuvable</div>
      <button class="btn btn--primary" style="margin-top:16px;" @click="$router.push('/')">Retour</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { library, updateSeries, removeSeries, toggleOwnedVolume, STATUS_LABELS } from '../stores/library.js'

const route = useRoute()
const router = useRouter()
const showToast = inject('showToast')

const TYPE_LABELS = { anime: 'Anime', manga: 'Manga', both: 'Anime & Manga' }

const series = computed(() => library.find(s => s.id === route.params.id))

// Local editable copies
const editStatus   = ref('')
const editWatched  = ref(0)
const editScore    = ref(null)
const editNotes    = ref('')
const editMangaVolumes = ref(0)
const showFull     = ref(false)
const showVolumeInput = ref(false)
const newVolNum    = ref('')

watch(series, (s) => {
  if (!s) return
  editStatus.value  = s.status
  editWatched.value = s.animeWatched || 0
  editScore.value   = s.score
  editNotes.value   = s.notes || ''
  editMangaVolumes.value = s.mangaVolumes || 0
}, { immediate: true })

function save() {
  updateSeries(series.value.id, {
    status: editStatus.value,
    animeWatched: editWatched.value,
    score: editScore.value,
    notes: editNotes.value,
    mangaVolumes: editMangaVolumes.value
  })
}

const animePercent = computed(() => {
  if (!series.value?.animeEpisodes) return 0
  return Math.min(100, Math.round((editWatched.value / series.value.animeEpisodes) * 100))
})

const gridSize = computed(() => {
  const total = editMangaVolumes.value || 0
  const maxOwned = Math.max(0, ...(series.value?.ownedVolumes || [0]))
  return Math.max(total, maxOwned)
})

const missingVolumes = computed(() => {
  if (!editMangaVolumes.value) return []
  const owned = new Set(series.value?.ownedVolumes || [])
  return Array.from({ length: editMangaVolumes.value }, (_, i) => i + 1).filter(n => !owned.has(n))
})

function isOwned(n) {
  return series.value?.ownedVolumes?.includes(n) ?? false
}

function toggleVol(n) {
  toggleOwnedVolume(series.value.id, n)
}

function addVolume() {
  if (!newVolNum.value) return
  toggleOwnedVolume(series.value.id, newVolNum.value)
  showToast(`📖 Tome ${newVolNum.value} ajouté !`)
  newVolNum.value = ''
  showVolumeInput.value = false
}

function confirmDelete() {
  if (confirm(`Supprimer "${series.value.title}" de ta bibliothèque ?`)) {
    removeSeries(series.value.id)
    router.push('/')
    showToast('🗑 Série supprimée.')
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.hero-card { position: relative; overflow: hidden; }
.hero-bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  filter: blur(12px) brightness(.3);
  transform: scale(1.1);
}
.hero-content { position: relative; display: flex; gap: 14px; padding: 16px; }
.hero-cover {
  width: 80px; height: 114px;
  border-radius: 8px; object-fit: cover;
  flex-shrink: 0; box-shadow: 0 4px 20px rgba(0,0,0,.5);
}
.hero-cover--placeholder {
  background: var(--bg-raised);
  display: flex; align-items: center; justify-content: center;
  font-size: 32px;
}
.hero-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding-top: 4px; }
.hero-title { font-size: 18px; font-weight: 700; line-height: 1.3; }
.truncated {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
