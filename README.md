# Otaku Shelf 📚

PWA mobile-first pour suivre tes animes et gérer ta collection physique de mangas.

## Stack
- **Vue 3** + Vite
- **vite-plugin-pwa** (Service Worker + manifest)
- **html5-qrcode** (scanner ISBN caméra)
- **Jikan API** (données MAL)
- **Google Books API** (ISBN → métadonnées)
- **LocalStorage** (zéro backend, 100% gratuit)

## Démarrage rapide

```bash
npm install
npm run dev
```

## Build & déploiement

```bash
npm run build   # génère /dist
npm run preview # tester le build localement
```

### GitHub Pages

1. Dans `vite.config.js`, décommente et ajuste `base: '/NOM_DU_REPO/'`
2. Dans `.github/workflows/deploy.yml`, décommente la variable `VITE_BASE_URL`
3. Active GitHub Pages (Settings → Pages → Source: GitHub Actions)
4. Push sur `main` → déploiement automatique

### Vercel

1. Importe le repo sur [vercel.com](https://vercel.com)
2. Build command : `npm run build` — Output dir : `dist`
3. Le fichier `vercel.json` gère déjà le routing SPA

## Structure

```
src/
├── main.js                 # Entrée + router
├── App.vue                 # Shell + bottom nav + toast global
├── style.css               # Design system complet (tokens CSS)
├── stores/
│   └── library.js          # État réactif + LocalStorage
├── composables/
│   ├── useJikan.js         # Wrapper Jikan API v4
│   └── useGoogleBooks.js   # Lookup ISBN → Google Books
└── views/
    ├── Dashboard.vue        # Liste + stats + filtres
    ├── Search.vue           # Recherche Jikan + modal d'ajout
    ├── Scanner.vue          # Caméra ISBN + fallback manuel
    └── SeriesDetail.vue     # Détail + grille tomes + édition
```

## Fonctionnalités

| Feature | Vue |
|---|---|
| Dashboard avec double progression anime/manga | Dashboard |
| Recherche Jikan (anime + manga simultanés) | Search |
| Modal d'ajout : statut, note ⭐, avis personnel | Search |
| Scanner ISBN avec caméra (EAN-8, EAN-13, CODE-128) | Scanner |
| Fallback saisie manuelle ISBN | Scanner |
| Détection automatique du numéro de tome | useGoogleBooks |
| Grille visuelle des tomes possédés / manquants | SeriesDetail |
| Filtres : En cours / Terminé / Prévu | Dashboard |
| Stats globales (épisodes vus, tomes possédés) | Dashboard |
| 100% offline-first via Service Worker | PWA |
