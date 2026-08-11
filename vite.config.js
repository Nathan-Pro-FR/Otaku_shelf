import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Change 'otaku-shelf' to your GitHub repo name if deploying to GitHub Pages
  // base: '/otaku-shelf/',
  base: '/Otaku_shelf/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Otaku Shelf',
        short_name: 'OtakuShelf',
        description: 'Suivi d\'animes et gestion de collection de mangas',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.jikan\.moe\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'jikan-cache', expiration: { maxEntries: 50, maxAgeSeconds: 86400 } }
          },
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/books\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'gbooks-cache', expiration: { maxEntries: 50, maxAgeSeconds: 86400 } }
          }
        ]
      }
    })
  ]
})
