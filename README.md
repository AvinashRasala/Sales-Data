# Pulse — AI Business Intelligence Platform

Upload a sales CSV/Excel file and get: automatic data cleaning, an interactive
dashboard, a 30-day revenue forecast, inventory runway estimates, and
AI-generated business insights.

```
backend/    FastAPI + Pandas + Scikit-learn + SQLite/Postgres + OpenAI
frontend/   React + Vite + Plotly
sample-data/  Ready-to-upload clean + messy sample CSVs
```

## How it works

1. **Upload** — drop a `.csv` or `.xlsx` file in the browser.
2. **Clean** — the backend fuzzy-matches your columns to a canonical schema
   (date, region, product, revenue, etc.), fixes inconsistent casing and
   currency formatting, removes duplicates, fills missing values, and flags
   statistical outliers (IQR method).
3. **Analyze** — KPIs, revenue trend, regional/product/category breakdowns,
   top customers, and anomaly list are computed and stored (SQLite locally,
   or Supabase Postgres if configured).
4. **Forecast** — a lightweight polynomial regression (scikit-learn) projects
   revenue forward; a separate model estimates days-until-stockout per
   product based on recent sales velocity.
5. **Recommend** — the computed analytics (not raw rows) are sent to an LLM,
   which returns a short list of prioritized, numbers-backed insights. If no
   `OPENAI_API_KEY` is set, a deterministic rule-based generator produces
   the same style of insight so the app is fully demoable without billing.

## Run locally (no Docker)

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
cp .env.example .env       # then fill in OPENAI_API_KEY if you have one
uvicorn app.main:app --reload --port 8000
```
Backend runs at `http://localhost:8000`. Interactive API docs at `/docs`.

**Frontend** (separate terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173` and proxies `/api/*` to the backend
automatically (see `vite.config.js`).

Open `http://localhost:5173`, drop in a sales file, and the dashboard builds itself.

## Run locally with Docker

```bash
# optional: export OPENAI_API_KEY=sk-... for real AI insights,
# otherwise the rule-based fallback is used automatically.
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

The frontend's nginx container proxies `/api/*` to the backend container, so
no extra configuration is needed.

## Your data file

The cleaner looks for columns like `Order Date`, `Region`, `Product Name`,
`Category`, `Customer`, `Units Sold`, `Total Sales` / `Revenue`, `Cost`,
`Profit` — header names are matched fuzzily (case/spacing/synonyms don't
matter much), so most real-world sales exports work without renaming
anything. At minimum you'll want a revenue/sales column for the KPIs to be
meaningful; everything else degrades gracefully if missing.

## Sample data

No sales data of your own? `sample-data/` has two ready-to-upload CSVs:
- `sample_sales_clean.csv` — tidy, shows off the dashboard/forecast/insights
- `sample_sales_messy.csv` — deliberately corrupted, shows off the cleaning pipeline

See `sample-data/README.md` for exactly what's wrong with the messy one.

## Auth (Supabase Auth)

Login, registration, and email verification are fully built — a login/register
screen gates the whole app, and every dataset is scoped to the logged-in user
(open the app in two different browsers/accounts and you'll each only see
your own uploads). Signup/login/verification happen entirely through
**Supabase Auth** on the frontend; the backend's only job is verifying the
JWT Supabase issues, via `supabase.auth.get_user(token)` (see
`backend/app/services/supabase_auth.py`).

**The app works with zero auth setup.** If you don't configure Supabase,
the login screen is skipped entirely and the app behaves like a single-user
local tool (matches how it worked before auth existed). Auth becomes active
automatically once you fill in the Supabase env vars below — no code changes
needed either way.

### Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. **Database connection** (optional — skip to keep using local SQLite):
   Project Settings → Database → Connection string → URI → copy the
   "Transaction pooler" string (port 6543) into `backend/.env` as
   `DATABASE_URL`.
3. **Auth keys**: Project Settings → API → copy the **Project URL** and the
   **Publishable key** (`sb_publishable_...`) into `backend/.env`:
   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
   ```
   Use the *publishable* key, not the legacy `anon` key — Supabase is
   retiring legacy keys by end of 2026. Never put the *secret* key anywhere
   in this project; it isn't needed since the backend only verifies tokens.
4. **Frontend** (local dev): copy `frontend/.env.example` to `frontend/.env`
   and fill in the same URL/key:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
   ```
5. **Frontend (Docker/Render/Railway)**: set `SUPABASE_URL` and
   `SUPABASE_PUBLISHABLE_KEY` as regular container env vars, not Vite build
   args — same reasoning as `BACKEND_URL` (see the nginx section below):
   Render's Docker build has no field for build-time arguments, so these are
   injected into a small `config.js` at container **startup** instead (see
   `frontend/40-generate-runtime-config.sh`). `docker-compose.yml` and
   `render.yaml` already have the right env var names wired up — just fill
   in real values.
6. **Required — configure redirect URLs in Supabase**: go to Authentication
   → URL Configuration in the Supabase dashboard and set:
   - **Site URL** to wherever your frontend actually runs (e.g.
     `http://localhost:5173` for local dev, or your `*.onrender.com` URL in
     production)
   - Add that same URL to **Redirect URLs**

   Skipping this is the single most common reason email confirmation links
   don't work — Supabase silently redirects to the wrong place instead of
   erroring, which makes it look broken when it's just unconfigured.
7. Supabase's own built-in email service is capped at **2 emails/hour** —
   fine for testing, not for real usage. For anything beyond a demo,
   configure a custom SMTP provider under Authentication → Settings → SMTP
   Settings in the Supabase dashboard (Brevo, Resend, etc. all work).

## Dashboard features

- **Admin-panel layout**: a persistent left sidebar (Dashboard / Datasets /
  Upload New) and top header bar (breadcrumb, date, notification badge for
  anomaly count), instead of a single standalone page — lets you switch
  between previously-uploaded datasets without losing your place.
- **Click-to-drill-down**: click any bar in the region or product charts to
  open a detail view scoped to just that region/product — its own KPIs,
  revenue trend, and top breakdown within it.
- **Date-range filtering**: 7D / 30D / 90D / All quick filters on the
  revenue trend chart, computed client-side from already-loaded data (no
  extra API calls, stays snappy).
- **Sparkline on the revenue KPI card**: a compact inline trend line, colored
  green/red to match whether revenue is trending up or down.
- **Category mix radar chart**: an additional widget type beyond bar/line
  charts, for visual variety.
- **Auto-refresh**: the dashboard silently re-fetches every 60 seconds while
  the tab is visible, with a "updated Xs ago" indicator — pauses when the
  tab isn't in focus so it doesn't burn requests in the background.
- **Skeleton loading states**: the initial dashboard load shows shaped
  placeholder blocks instead of a blank "loading" message.

## Deploying

### Render

A `render.yaml` Blueprint is included for both services.
1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, select the repo, apply.
3. In the backend service's Environment tab, set: `OPENAI_API_KEY` (optional),
   `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` (skip the Supabase vars to
   run without auth). If using Supabase Postgres, also set `DATABASE_URL`.
4. Update the `CORS_ORIGINS` value (backend service) and `BACKEND_URL` value
   (frontend service) in `render.yaml` once you know your actual
   `*.onrender.com` URLs (Render assigns them after first deploy — edit
   and redeploy once with the real URLs filled in).

**Note on `BACKEND_URL`:** Render's Blueprint spec has no field for passing
Docker build-time arguments, so the frontend can't bake the backend's URL
in via a Vite env var the way you might expect. Instead, `BACKEND_URL` is a
normal runtime environment variable that nginx substitutes into its proxy
config when the container **starts** (see `frontend/nginx.conf.template` —
this uses nginx's own built-in templating feature, not custom code). The
frontend calls its own same-origin `/api`, and nginx forwards that to
whatever `BACKEND_URL` points at.

**Note on data persistence (free tier):** Render's free instance type
can't have a persistent disk attached at all — that's a paid-plan-only
feature, not something a config change can unlock. Without one, the
backend's SQLite file is wiped every time the service redeploys or spins
down from inactivity and back up (which happens after 15 minutes of no
traffic). For a quick demo this is often fine — just know your uploaded
datasets won't survive a restart. For real persistence on the free tier,
point `DATABASE_URL` at Supabase's Postgres instead (see the comment in
`render.yaml`); it's external to Render, so it isn't affected by Render's
ephemeral filesystem at all. The alternative is upgrading the backend
service to a paid Starter plan or higher and re-adding a `disk:` block.

### Railway
Each service has its own `railway.json` (`backend/railway.json`,
`frontend/railway.json`). The frontend uses the same nginx + `BACKEND_URL`
runtime mechanism as Render (see above) — not a Docker build argument.
1. Create a new Railway project, add two services pointing at the `backend/`
   and `frontend/` directories of this repo respectively (set each service's
   **Root Directory** accordingly).
2. Railway auto-detects the Dockerfile in each. Set `OPENAI_API_KEY`,
   `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, and
   `CORS_ORIGINS` as variables on the backend service.
3. On the frontend service, set `BACKEND_URL` to the backend service's
   public Railway URL as a regular (runtime) variable.

### Vercel (frontend only)
Vercel doesn't run the FastAPI backend, and it doesn't use `frontend/Dockerfile`
or nginx at all — it runs `npm run build` directly. Deploy the backend
separately (Render or Railway), then deploy `frontend/` to Vercel as a
static Vite build, setting `VITE_API_URL` as a Vercel project environment
variable (the backend's full public URL, e.g. `https://my-backend.onrender.com`).
Unlike the Docker-based platforms above, Vite bakes this in normally at
build time here — see the comment in `frontend/src/api.js` for why the two
deployment shapes need different mechanisms.

## Tech stack

Python, Pandas, NumPy, Scikit-learn, FastAPI, SQLAlchemy (SQLite or Supabase
Postgres), Supabase Auth, OpenAI API, React, Vite, Plotly, Docker.

## Known limitations (good to mention in an interview)

- Forecast confidence bands are a simple residual-std model — fine for a
  portfolio project, not a production forecasting system.
- Inventory runway assumes a notional 30-day starting stock when no real
  stock level is supplied (clearly flagged in the UI with an asterisk).
- Anomaly detection uses per-product IQR bounds (falling back to a global
  threshold for products with too few rows), which avoids flagging normal
  bulk orders of expensive products as outliers — but it's still a fairly
  simple statistical rule, not a learned model.
- Backend/Supabase JWT verification calls Supabase's Auth server on every
  request (`get_user`) rather than verifying locally against cached JWKS —
  simpler and more robust to key rotation, at the cost of one extra network
  hop per authenticated request. Fine for a portfolio project's traffic
  levels; swap to `get_claims()` if you need to shave that latency later.
