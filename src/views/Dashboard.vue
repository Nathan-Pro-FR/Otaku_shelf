<template>
  <div class="view">
    <!-- Header -->
    <div class="section-header" style="margin-bottom: 20px;">
      <div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:2px;">Ma bibliothèque</div>
        <h1 class="section-title">Otaku Shelf 📚</h1>
      </div>
      <div style="text-align:right; font-size:12px; color:var(--text-muted);">
        <div>{{ library.length }} série{{ library.length !== 1 ? 's' : '' }}</div>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="stats-strip card" v-if="library.length">
      <div class="stat">
        <div class="stat__val">{{ totalWatched }}</div>
        <div class="stat__label">Épisodes vus</div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat">
        <div class="stat__val">{{ totalOwned }}</div>
        <div class="stat__label">Tomes possédés</div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat">
        <div class="stat__val">{{ inProgress }}</div>
        <div class="stat__label">En cours</div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="filter-tabs" v-if="library.length">
      <button
        v-for="f in FILTERS" :key="f.key"
        class="filter-tab" :class="{ active: filter === f.key }"
        @click="filter = f.key"
      >{{ f.label }}</button>
    </div>

    <!-- Series list -->
    <template v-if="filtered.length">
      <div
        v-for="s in filtered" :key="s.id"
        class="card series-card"
        @click="$router.push(`/series/${s.id}`)"
      >
        <img v-if="s.coverUrl" :src="s.coverUrl" class="series-card__cover" :alt="s.title" />
        <div v-else class="series-card__cover-placeholder">🎌</div>

        <div class="series-card__body">
          <div class="series-card__title">{{ s.title }}</div>
          <div class="series-card__status">
            <span class="badge" :class="`badge--${s.type}`">{{ TYPE_LABELS[s.type] }}</span>
            &nbsp;{{ STATUS_LABELS[s.status] }}
            <span v-if="s.score"> · ⭐ {{ s.score }}/10</span>
          </div>

          <div class="progress-row">
            <!-- Anime progress -->
            <div class="progress-item" v-if="s.type !== 'manga'">
              <div style="display:flex;justify-content:space-between;">
                <span>📺 Anime</span>
                <span>{{ s.animeWatched }}/{{ s.animeEpisodes || '?' }} ep</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-bar__fill progress-bar__fill--anime"
                  :style="{ width: animePercent(s) + '%' }"
                />
              </div>
            </div>

            <!-- Manga progress -->
            <div class="progress-item" v-if="s.type !== 'anime'">
              <div style="display:flex;justify-content:space-between;">
                <span>📖 Manga</span>
                <span>{{ s.ownedVolumes?.length || 0 }}/{{ s.mangaVolumes || '?' }} tomes</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-bar__fill progress-bar__fill--manga"
                  :style="{ width: mangaPercent(s) + '%' }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div class="empty" v-else-if="!library.length">
      <div class="empty__icon">🎌</div>
      <div class="empty__title">Collection vide</div>
      <div class="empty__desc">Recherche un anime ou manga pour commencer ta collection !</div>
      <RouterLink to="/search">
        <button class="btn btn--primary" style="margin-top:16px;">Ajouter une série</button>
      </RouterLink>
    </div>

    <div class="empty" v-else>
      <div class="empty__icon">🔍</div>
      <div class="empty__title">Aucun résultat</div>
      <div class="empty__desc">Aucune série dans cette catégorie.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { library, STATUS_LABELS } from '../stores/library.js'

const TYPE_LABELS = { anime: 'Anime', manga: 'Manga', both: 'Anime & Manga' }
const FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'watching', label: 'En cours' },
  { key: 'completed', label: 'Terminé' },
  { key: 'plan', label: 'Prévu' }
]

const filter = ref('all')

const filtered = computed(() =>
  filter.value === 'all' ? library : library.filter(s => s.status === filter.value)
)

const totalWatched = computed(() => library.reduce((a, s) => a + (s.animeWatched || 0), 0))
const totalOwned   = computed(() => library.reduce((a, s) => a + (s.ownedVolumes?.length || 0), 0))
const inProgress   = computed(() => library.filter(s => s.status === 'watching').length)

function animePercent(s) {
  if (!s.animeEpisodes) return 0
  return Math.min(100, Math.round((s.animeWatched / s.animeEpisodes) * 100))
}
function mangaPercent(s) {
  if (!s.mangaVolumes) return 0
  return Math.min(100, Math.round(((s.ownedVolumes?.length || 0) / s.mangaVolumes) * 100))
}
</script>

<style scoped>
.stats-strip {
  display: flex;
  padding: 14px 0;
  margin-bottom: 16px;
}
.stat { flex: 1; text-align: center; }
.stat__val { font-size: 22px; font-weight: 700; color: var(--accent); }
.stat__label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.stat-sep { width: 1px; background: var(--border); margin: 4px 0; }

.filter-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  overflow-x: auto;
  scrollbar-width: none;
}
.filter-tabs::-webkit-scrollbar { display: none; }
.filter-tab {
  white-space: nowrap;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 13px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-muted);
  transition: all .15s;
}
.filter-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
</style>
