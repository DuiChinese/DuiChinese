# Frontend — DuiChinese

React + Vite + Tailwind v4 + shadcn/ui study hall for Hanzi.

## Brand assets

All public images live in `public/` (nothing in `src/assets`):

- `favicon.svg` — tab icon, gold 对 on crimson
- `apple-touch-icon.svg` — home-screen icon
- `site.webmanifest` — name, theme color, icons
- `assets/logo.svg` — wordmark used in the nav

## Visual system

- Canvas: crimson `#960708`
- Seals and nav: gold `#FECB6D`
- Paper cards: `public/assets/card-frame.jpg` (回纹), native 1024×819 proportion, slightly rounded corners
- Headings: [ZCOOL KuaiLe](https://fonts.google.com/specimen/ZCOOL+KuaiLe)
- Hanzi: [Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC) bold
- UI: Geist
- No gradients

## Screens

- `/` landing: purpose of the study hall, no live flashcard
- `/flashcards` modes `hanzi`, `meaning`, `listen`, `speak` (`?mode=`)
- `/characters` search + tone filter
- `/stats` review counters

## Scripts

```bash
npm install
cp .env.example .env
npm run dev
npm run test:run
npm run build
```

The UI talks to `VITE_API_URL` (default `http://localhost:8000`). If the API is down, the local HSK 1 deck is used so the pages still work.
