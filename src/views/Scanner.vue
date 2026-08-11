<template>
  <div class="view scanner-view">
    <!-- Phase: select series -->
    <div v-if="phase === 'select'" style="padding:16px;">
      <h1 class="section-title" style="margin-bottom:6px;">Scanner ISBN</h1>
      <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px;">
        Scanne le code-barres d'un tome de manga pour l'ajouter à ta collection.
      </p>

      <div v-if="!library.length" class="empty">
        <div class="empty__icon">📚</div>
        <div class="empty__title">Collection vide</div>
        <div class="empty__desc">Ajoute d'abord une série via la recherche.</div>
        <RouterLink to="/search">
          <button class="btn btn--primary" style="margin-top:16px;">Ajouter une série</button>
        </RouterLink>
      </div>

      <template v-else>
        <div class="form-group">
          <label class="form-label">Associer à quelle série ?</label>
          <select v-model="selectedSeriesId">
            <option value="">— Choisir une série —</option>
            <option v-for="s in library" :key="s.id" :value="s.id">{{ s.title }}</option>
          </select>
        </div>

        <button
          class="btn btn--primary btn--block"
          style="margin-top:12px;"
          :disabled="!selectedSeriesId"
          @click="startScan"
        >
          📷 Lancer le scanner
        </button>

        <!-- Manual ISBN fallback -->
        <div style="margin-top:24px;">
          <label class="form-label">Ou saisir un ISBN manuellement</label>
          <div class="search-bar">
            <input v-model="manualIsbn" type="text" placeholder="978-2-01-327252-2" />
            <button class="btn btn--secondary" @click="processIsbn(manualIsbn)" :disabled="!manualIsbn || !selectedSeriesId">OK</button>
          </div>
        </div>
      </template>
    </div>

    <!-- Phase: scanning -->
    <div v-if="phase === 'scanning'" style="position:relative;">
      <div id="qr-reader"></div>

      <!-- Frame overlay -->
      <div class="scanner-overlay">
        <div class="scan-frame"></div>
      </div>

      <!-- Instructions -->
      <div style="padding:16px;text-align:center;">
        <p style="font-size:14px;color:var(--text-muted);margin-bottom:12px;">
          Centre le code-barres dans le cadre rouge
        </p>
        <button class="btn btn--secondary" @click="stopScan">Annuler</button>
      </div>
    </div>

    <!-- Phase: result -->
    <div v-if="phase === 'result'" style="padding:16px;">
      <div class="loader" v-if="gBooksLoading"><div class="spinner"></div></div>

      <template v-else-if="bookInfo">
        <h2 style="margin-bottom:16px;">Tome trouvé !</h2>

        <div class="card" style="display:flex;gap:12px;padding:14px;margin-bottom:16px;">
          <img v-if="bookInfo.coverUrl" :src="bookInfo.coverUrl" style="width:70px;height:100px;border-radius:8px;object-fit:cover;" />
          <div>
            <div style="font-weight:600;font-size:15px;margin-bottom:4px;">{{ bookInfo.title }}</div>
            <div style="font-size:13px;color:var(--text-muted);">{{ bookInfo.authors }}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">ISBN : {{ bookInfo.isbn }}</div>
          </div>
        </div>

        <!-- Volume number input -->
        <div class="form-group">
          <label class="form-label">Numéro du tome</label>
          <input type="number" v-model.number="volumeNumber" min="1" />
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
            Détecté automatiquement : {{ bookInfo.volumeNumber ?? 'non détecté' }}
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn--secondary" style="flex:1" @click="phase = 'select'">Annuler</button>
          <button class="btn btn--primary" style="flex:1" @click="confirmAdd">
            ✅ Ajouter tome {{ volumeNumber }}
          </button>
        </div>
        <button class="btn btn--secondary btn--block" style="margin-top:8px;" @click="startScan">
          📷 Scanner un autre
        </button>
      </template>

      <template v-else-if="gBooksError">
        <div class="empty">
          <div class="empty__icon">⚠️</div>
          <div class="empty__title">ISBN introuvable</div>
          <div class="empty__desc">{{ gBooksError }}</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
          <button class="btn btn--secondary" style="flex:1" @click="phase = 'select'">Retour</button>
          <button class="btn btn--primary" style="flex:1" @click="startScan">Réessayer</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onUnmounted } from 'vue'
import { library, addVolumeByIsbn } from '../stores/library.js'
import { useGoogleBooks } from '../composables/useGoogleBooks.js'

const showToast = inject('showToast')

const phase = ref('select')
const selectedSeriesId = ref('')
const manualIsbn = ref('')
const volumeNumber = ref(1)

const { result: bookInfo, loading: gBooksLoading, error: gBooksError, lookupIsbn } = useGoogleBooks()

let scanner = null

async function startScan() {
  phase.value = 'scanning'
  await new Promise(r => setTimeout(r, 100)) // wait for DOM

  // Dynamic import to avoid SSR issues
  const { Html5Qrcode } = await import('html5-qrcode')
  scanner = new Html5Qrcode('qr-reader')

  const config = {
    fps: 10,
    qrbox: { width: 280, height: 100 },
    formatsToSupport: [
      8,  // EAN_8
      9,  // EAN_13
      11  // CODE_128
    ]
  }

  try {
    await scanner.start(
      { facingMode: 'environment' },
      config,
      onScanSuccess,
      () => {} // ignore decode errors
    )
  } catch (e) {
    showToast('⚠️ Caméra inaccessible : ' + e.message)
    phase.value = 'select'
  }
}

async function onScanSuccess(decodedText) {
  await stopScan()
  processIsbn(decodedText)
}

async function stopScan() {
  try {
    if (scanner) {
      await scanner.stop()
      scanner.clear()
      scanner = null
    }
  } catch {}
  if (phase.value === 'scanning') phase.value = 'select'
}

async function processIsbn(isbn) {
  if (!isbn || !selectedSeriesId.value) return
  const clean = isbn.replace(/[^0-9X]/gi, '')
  phase.value = 'result'
  const info = await lookupIsbn(clean)
  if (info?.volumeNumber) volumeNumber.value = info.volumeNumber
  else volumeNumber.value = 1
}

function confirmAdd() {
  const success = addVolumeByIsbn(selectedSeriesId.value, volumeNumber.value)
  if (success) {
    const series = library.find(s => s.id === selectedSeriesId.value)
    showToast(`📖 Tome ${volumeNumber.value} ajouté à "${series?.title}" !`)
    phase.value = 'select'
    manualIsbn.value = ''
  } else {
    showToast('⚠️ Série introuvable.')
  }
}

onUnmounted(() => {
  stopScan()
})
</script>
