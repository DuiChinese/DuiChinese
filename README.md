<div align="center">
  <img src="frontend/public/assets/logo.svg" alt="DuiChinese Logo" width="380" />

  <p><strong>Open-source platform to master Chinese Hanzi using Anki's Spaced Repetition Algorithm</strong></p>

  <p>
    <a href="#licencia"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
    <img src="https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/tests-29%20passing-brightgreen" alt="Tests 29 passing" />
  </p>
</div>

---

## 🏮 About DuiChinese

**DuiChinese (对Chinese)** is an interactive, open-source web application designed to help learners study and retain Chinese characters (汉字 - Hanzi) through active recall and spaced repetition.

### ✨ Key Features

1. **Clean, Minimalist Flat Aesthetic**:
   - Flat crimson canvas (`#960708`) with zero gradients. Ivory paper (`#F5F2EB`) and gold seals (`#FECB6D`).
   - Headings in **ZCOOL KuaiLe** (the logo face). Hanzi in **Noto Sans TC** bold.
   - Ivory paper card using `frontend/public/assets/card-frame.jpg` (回纹), scaled in proportion with slightly rounded corners.
   - Floating gold speaker for Putonghua (`zh-CN`); snail button plays the same Mandarin audio slowly. Never Cantonese.
   - Landing page (`/`) is a quiet crimson poster: purpose copy, one gold CTA, and a hall of bouncing hanzi that scatter from the cursor.

2. **Anki Spaced Repetition System (SM-2)**:
   - Full Python implementation of Anki's open-source SuperMemo-2 (SM-2) scheduling algorithm (`backend/app/core/anki_srs.py`).
   - 4-rating review system:
     - **Again (1)**: Lapse recorded, repetitions reset to 0, interval reset to 1 day, ease factor decreased by 0.20.
     - **Hard (2)**: Interval scaled by 1.2x, ease factor decreased by 0.15.
     - **Medium (3)**: Standard SM-2 interval progression (1d → 6d → interval × ease).
     - **Easy (4)**: Multiplied with 1.3x easy bonus, ease factor increased by 0.15.
   - Per-card SRS progress tracking (`CardSRS`) with due date calculations and review history.

3. **100% English Interface**:
   - Navigation: **Flashcards**, **Characters**, **Stats**.
   - Flashcard modes: **Hanzi** (character → reading), **Meaning** (reading → character), **Listen** (audio → write hanzi), **Speak** (see hanzi → say it).
   - Flashcard controls: **Previous**, **Turn around**, **Next**, and **Again**, **Hard**, **Medium**, **Easy** after a reveal.

4. **Keyboard-First Experience**:
   - `Space`: Turn around / flip card.
   - `←` / `→`: Navigate Previous / Next card.
   - `1`, `2`, `3`, `4`: Submit Anki SRS rating (`Again`, `Hard`, `Medium`, `Easy`).
   - `R`: Play Mandarin audio. `Shift+R`: play slowly.

---

## 📁 Project structure

Brand images live only in `frontend/public/`. Scratch SVGs (`2.svg`, `3.svg`, `test_logo.svg`) and screenshot PNGs are gone.

```
DuiChinese/
├── backend/                 FastAPI + SM-2 + HSK seed
│   ├── app/
│   │   ├── api/endpoints/   characters, practice, pronunciation, seed
│   │   ├── core/            config, Anki SRS
│   │   ├── data/            HSK 1 seed
│   │   ├── db/
│   │   ├── models/
│   │   └── schemas/
│   └── tests/
├── frontend/                Vite + React 19 + Tailwind + shadcn
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── apple-touch-icon.svg
│   │   ├── site.webmanifest
│   │   └── assets/logo.svg  wordmark (对 dui chinese!)
│   └── src/
│       ├── components/      AppShell, HanziCard, BrandLogo, ui/
│       ├── pages/           landing, flashcards, characters, stats
│       ├── lib/             api, speech, recognition, study modes
│       ├── data/            offline HSK 1 deck
│       └── hooks/
└── docs/                    API + architecture
```

---

## 🚀 Quickstart

### 1. Backend (FastAPI + Python)

```bash
cd backend

# Create & activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Run test suite
pytest -v

# Start development server
uvicorn app.main:app --reload --port 8000
```
- Interactive OpenAPI documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (React + Vite + Tailwind + shadcn)

```bash
cd frontend

# Install dependencies
npm install

# Run frontend tests
npm run test:run

# Build production bundle
npm run build

# Start development server
npm run dev
```
- Access the web interface at: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Verification Commands

```bash
# Backend test verification (21 tests)
cd backend && source venv/bin/activate && pytest -v

# Frontend test & build verification
cd frontend && npm run test:run && npm run build
```

---

## 📄 License

MIT License © 2026 DuiChinese
