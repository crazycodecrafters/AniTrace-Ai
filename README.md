<p align="center">
  <img src="https://skillicons.dev/icons?i=github,react,vercel,nodejs,html,css,js,ts,linux,git,vite" alt="tech" />
</p>

# <div align="center">**AniTrace AI**</div>

<div align="center">**Ultimate Anime Scene Scanner • Neural Recommendations • Multi-Modal Search**</div>

---

## ✨ Overview

**AniTrace AI** is a privacy-first, lightning-fast web app that identifies anime scenes from screenshots, direct URLs, or clipboard images and recommends similar shows using client-side embeddings and AniList intelligence. It features multi-candidate match inspection, title search with granular filters (18+ genres, formats, status, release years, score), gamified XP & badges, and on-device IndexedDB storage.

---

## 🚀 What makes AniTrace AI unique

* **Privacy-first:** IndexedDB (localForage) stores scans & embeddings locally — no data leaves your browser.
* **Multi-Modal Scene Scanner:** Reverse-image scene lookup with confidence ratings, candidate match comparator, video previews, timecode scrubber, and clipboard paste (`Ctrl+V`).
* **Title & Filter Search Engine:** Live debounced search querying AniList with 18+ genres, formats, release years, and sort presets.
* **Client-Side AI Recommendations:** 75-dimensional hybrid feature vectors and cosine similarity for instant on-device recommendations.
* **Global Command Palette (`Ctrl+K`):** Keyboard-driven instant lookup across titles, recent scans, and discovery feeds.
* **Gamified Otaku Progression:** Streaks, levels, and unlockable achievement badges.

---

## 🧭 Architecture

```
[User Browser] --(image / screenshot)--> [trace.moe API] --> Candidate Matches
      |                                              |
      |--(store)--> IndexedDB (scan + embeddings) <--+--> AniList GraphQL
      |                                              |
      '--(cosine similarity)--> AI Recommendations <--+
```

---

## 🛠️ Quick Start (Developer)

```bash
# Prereqs: Node >= 18 or Bun
bun install  # or npm install

# Run dev server
bun run dev  # or npm run dev

# Build for production
bun run build
```

---

## 🧾 License

MIT © AniTrace AI contributors
