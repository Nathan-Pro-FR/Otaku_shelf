<template>
  <div class="view">
    <h1 class="section-title" style="margin-bottom:16px;">Recherche</h1>

    <!-- Search bar -->
    <div class="search-bar">
      <input
        v-model="query"
        type="search"
        placeholder="Naruto, One Piece, Attack on Titan…"
        @keyup.enter="doSearch"
        autocomplete="off"
        ref="inputRef"
      />
      <button class="btn btn--primary" @click="doSearch" :disabled="loading">
        <span v-if="loading">…</span>
        <span v-else>OK</span>
      </button>
    </div>

    <!-- Type toggle -->
    <div class="filter-tabs" style="margin-bottom:16px;">
      <button
        v-for="t in TYPES" :key="t.key"
        class="filter-tab" :class="{ active: searchType === t.key }"
        @click="searchType = t.key"
      >{{ t.label }}</button>
    </div>

    <!-- Loader -->
    <div class="loader" v-if="loading"><div class="spinner"></div></div>

    <!-- Error -->
    <div class="empty" v-else-if="error">
      <div class="empty__icon">⚠️</div>
      <div class="empty__title">Erreur API</div>
      <div class="empty__desc">{{ error }}</div>
    </div>

    <!-- Results -->
    <template v-else-if="results.length">
      <div class="section-header">
        <span style="font-size:13px;color:var(--text-muted);">{{ results.length }} résultat{{ results.length > 1 ? 's' : '' }}</span>
      </div>

      <div
        v-for="item in results" :key="item.id"
        class="card search-result"
        @click="openModal(item)"
      >
        <img v-if="item.coverUrl" :src="item.coverUrl" class="result-cover" :alt="item.title" />
        <div v-else class="result-cover result-cover--placeholder">🎌</div>
        <div class="result-body">
          <div class="result-title">{{ item.title }}</div>
          <div v-if="item.titleJp && item.titleJp !== item.title" class="result-subtitle">{{ item.titleJp }}</div>
          <div style="margin-top:4px;">
            <span class="badge" :class="`badge--${item.type}`">{{ TYPE_LABELS[item.type] }}</span>
          </div>
          <div class="result-meta">
            <span v-if="item.animeEpisodes">📺 {{ item.animeEpisodes }} ep</span>
            <span v-if="item.mangaVolumes">📖 {{ item.mangaVolumes }} tomes</span>
          </div>
          <div class="result-synopsis">{{ item.synopsis?.slice(0, 120) }}{{ item.synopsis?.length > 120 ? '…' : '' }}</div>
        </div>
        <div class="result-add">
          <span v-if="isInLibrary(item.id)">✓</span>
          <span v-else>＋</span>
        </div>
      </div>
    </template>

    <!-- Empty search state -->
    <div class="empty" v-else-if="searched && !loading">
      <div class="empty__icon">🔍</div>
      <div class="empty__title">Aucun résultat</div>
      <div class="empty__desc">Essaie un autre terme ou type.</div>
    </div>

    <!-- Initial state -->
    <div class="empty" v-else>
      <div class="empty__icon">🔎</div>
      <div class="empty__title">Recherche une série</div>
      <div class="empty__desc">Tape le nom d'un anime ou d'un manga ci-dessus.</div>
    </div>

    <!-- Add modal -->
    <Teleport to="body">
      <div class="modal-overlay" v-if="selected" @click.self="selected = null">
        <div class="modal">
          <div class="modal-handle"></div>

          <div style="display:flex;gap:12px;margin-bottom:16px;">
            <img v-if="selected.coverUrl" :src="selected.coverUrl" style="width:70px;height:100px;border-radius:8px;object-fit:cover;" />
            <div>
              <h2 style="margin-bottom:4px;">{{ selected.title }}</h2>
              <span class="badge" :class="`badge--${selected.type}`">{{ TYPE_LABELS[selected.type] }}</span>
              <p style="font-size:13px;color:var(--text-muted);margin-top:8px;line-height:1.5;">{{ selected.synopsis?.slice(0, 200) }}{{ selected.synopsis?.length > 200 ? '…' : '' }}</p>
            </div>
          </div>

          <!-- Status -->
          <div class="form-group">
            <label class="form-label">Statut</label>
            <select v-model="form.status">
              <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>

          <!-- Episodes watched (anime) -->
          <div class="form-group" v-if="selected.type !== 'manga'">
            <label class="form-label">Épisodes vus</label>
            <input type="number" v-model.number="form.animeWatched" min="0" :max="selected.animeEpisodes || 9999" />
          </div>

          <!-- Score -->
          <div class="form-group">
            <label class="form-label">Note</label>
            <div class="star-row">
              <button
                v-for="n in 10" :key="n"
                class="star-btn"
                @click="form.score = form.score === n ? null : n"
              >{{ form.score >= n ? '⭐' : '☆' }}</button>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label class="form-label">Avis personnel</label>
            <textarea v-model="form.notes" rows="3" placeholder="Mes impressions…"></textarea>
          </div>

          <div style="display:flex;gap:8px;margin-top:4px;">
            <button class="btn btn--secondary" style="flex:1" @click="selected = null">Annuler</button>
            <button class="btn btn--primary" style="flex:1" @click="addToLibrary">
              {{ isInLibrary(selected.id) ? 'Mettre à jour' : 'Ajouter' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, inject } from 'vue'
import { useJikan } from '../composables/useJikan.js'
import { library, addSeries, updateSeries, STATUS_LABELS } from '../stores/library.js'

const showToast = inject('showToast')

const TYPE_LABELS = { anime: 'Anime', manga: 'Manga', both: 'Anime & Manga' }
const TYPES = [
  { key: 'both', label: 'Tout' },
  { key: 'anime', label: 'Anime' },
  { key: 'manga', label: 'Manga' }
]

const query = ref('')
const searchType = ref('both')
const searched = ref(false)
const selected = ref(null)

const { results, loading, error, searchAnime, searchManga, searchBoth } = useJikan()

const form = reactive({ status: 'plan', animeWatched: 0, score: null, notes: '' })

async function doSearch() {
  if (!query.value.trim()) return
  searched.value = true
  if (searchType.value === 'anime') await searchAnime(query.value)
  else if (searchType.value === 'manga') await searchManga(query.value)
  else await searchBoth(query.value)
}

function openModal(item) {
  selected.value = item
  const existing = library.find(s => s.id === item.id)
  if (existing) {
    Object.assign(form, { status: existing.status, animeWatched: existing.animeWatched, score: existing.score, notes: existing.notes })
  } else {
    Object.assign(form, { status: 'plan', animeWatched: 0, score: null, notes: '' })
  }
}

function isInLibrary(id) {
  return library.some(s => s.id === id)
}

function addToLibrary() {
  const patch = {
    status: form.status,
    animeWatched: form.animeWatched,
    score: form.score,
    notes: form.notes
  }
  if (isInLibrary(selected.value.id)) {
    updateSeries(selected.value.id, patch)
    showToast('✏️ Série mise à jour !')
  } else {
    addSeries({ ...selected.value, ...patch })
    showToast('✅ Série ajoutée à ta bibliothèque !')
  }
  selected.value = null
}
</script>

<style scoped>
.search-result {
  display: flex;
  gap: 10px;
  padding: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background .15s;
}
.search-result:active { background: var(--bg-raised); }
.result-cover {
  width: 52px; height: 76px;
  border-radius: 6px; object-fit: cover;
  flex-shrink: 0;
}
.result-cover--placeholder {
  background: var(--bg-raised);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.result-body { flex: 1; min-width: 0; }
.result-title { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
.result-subtitle { font-size: 12px; color: var(--text-muted); margin-bottom: 2px; }
.result-meta { display: flex; gap: 10px; font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.result-synopsis { font-size: 12px; color: var(--text-muted); margin-top: 4px; line-height: 1.4; }
.result-add {
  display: flex; align-items: center; justify-content: center;
  width: 28px; font-size: 20px; color: var(--accent); flex-shrink: 0;
}
</style>
