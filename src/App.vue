<template>
  <RouterView />
  <nav class="bottom-nav">
    <RouterLink to="/" class="nav-btn" :class="{ active: route.path === '/' }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
      Accueil
    </RouterLink>

    <RouterLink to="/search" class="nav-btn" :class="{ active: route.path === '/search' }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      Recherche
    </RouterLink>

    <RouterLink to="/scanner" class="nav-btn scanner-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M2 7V4a1 1 0 011-1h3M2 17v3a1 1 0 001 1h3M22 7V4a1 1 0 00-1-1h-3M22 17v3a1 1 0 01-1 1h-3"/>
        <line x1="7" y1="12" x2="17" y2="12"/>
      </svg>
      Scanner
    </RouterLink>
  </nav>

  <!-- Global toast -->
  <div class="toast-wrapper" v-if="toast">
    <div class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Global toast system
const toast = ref('')
let toastTimer
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.value = '', 2500)
}
provide('showToast', showToast)
</script>
