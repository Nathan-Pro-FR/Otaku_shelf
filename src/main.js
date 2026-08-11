import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Search from './views/Search.vue'
import Scanner from './views/Scanner.vue'
import SeriesDetail from './views/SeriesDetail.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/search', component: Search },
    { path: '/scanner', component: Scanner },
    { path: '/series/:id', component: SeriesDetail }
  ]
})

createApp(App).use(router).mount('#app')
