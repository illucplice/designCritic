# DesignCritic AI

A real, AI-powered design critique app. Upload a design and a vision-capable
Claude model inspects the actual image and returns a structured, scored
critique — no hardcoded scores, no canned feedback.

```
DesignCritic-AI-Replica/
├── designcritic-ai/     React + Vite frontend
└── backend/             Express API that talks to the Claude vision model
```

## How it works

```
Browser (React) → POST /api/analyze-design → Express backend → Claude (vision) → structured JSON → back to the browser
```

The frontend never talks to Anthropic directly and never sees an API key.
Every upload goes through the backend, which validates the file, resizes it,
sends it to Claude with a grounded prompt, validates the JSON that comes
back, and only then returns it to the browser.

## 1. Install dependencies

```bash
# from the project root
cd backend && npm install
cd ../designcritic-ai && npm install
```

## 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and set:

```
ANTHROPIC_API_KEY=sk-ant-...   # from https://console.anthropic.com/settings/keys
```

The other defaults (model, port, upload size limit, rate limit) work out of
the box, but feel free to adjust them.

## 3. Start the backend

```bash
cd backend
npm run dev
```

This starts the API on `http://localhost:8787`. You should see:

```
DesignCritic AI backend listening on http://localhost:8787
```

If you forgot to set `ANTHROPIC_API_KEY`, it'll warn you in the console and
`/api/analyze-design` will return a clear 503 error instead of crashing.

## 4. Start the frontend

In a second terminal:

```bash
cd designcritic-ai
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). The Vite dev
server proxies `/api/*` to the backend automatically, so no extra config is
needed in development.

## Production build

```bash
cd designcritic-ai && npm run build
```

This outputs static files to `designcritic-ai/dist`. The backend
automatically serves that folder if it exists, so you can run just
`node backend/server.js` (with `ANTHROPIC_API_KEY` set) to serve the whole
app from a single origin. Alternatively, host the built frontend anywhere
and point it at the backend with `VITE_API_BASE_URL` set at build time.

## Project structure

**Frontend** (`designcritic-ai/src/`)
- `App.jsx` — page routing, upload state, the analyze workflow, session-only history
- `api.js` — the only file that calls the backend
- `pages/` — Home, Analyze, Result, Compare, History
- `components/` — Sidebar, Topbar, ScoreBar, ErrorBanner
- `demoData.js` — two fixed, clearly-labeled sample critiques used only for onboarding (never presented as real analysis of a user's upload)
- `constants.js` — category labels, accepted file types, loading-step copy

**Backend** (`backend/`)
- `server.js` — Express app entrypoint
- `routes/analyze.js` — `POST /api/analyze-design`, `GET /api/health`
- `controllers/analyzeController.js` — request orchestration
- `middleware/upload.js` — multer upload + validation
- `middleware/errorHandler.js` — consistent, safe JSON error responses
- `services/imageProcessingService.js` — decodes, validates, and resizes the image (via `sharp`) before it's sent to the model
- `services/promptBuilder.js` — builds the mode-aware, grounded critique prompt
- `services/designAnalysisService.js` — the only file that talks to the Anthropic API
- `utils/validateAnalysis.js` — validates the AI's JSON and recomputes the true weighted overall score server-side
- `config/index.js` — all environment variables in one place

## Notes on data & privacy

- Uploaded images are held in memory only for the duration of a single
  request — nothing is written to disk or a database.
- Analysis history lives in the browser tab's memory for the current
  session only; it disappears on refresh. Wire it up to a real database if
  you want it to persist.
