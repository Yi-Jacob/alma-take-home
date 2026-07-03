# Running Locally

There are two ways to run the stack: the Docker one-liner (everything), or a
manual run (Postgres in Docker, API and web on your host). Both end up at the
same place — web on <http://localhost:3000>, API on <http://localhost:8000>.

## Option A — Docker (one command)

```bash
docker compose up
```

Builds and starts Postgres, the API, and the web app. Defaults are baked in, so
no configuration is required. To override anything, copy `.env.example` to
`.env` first (Compose loads it automatically).

- Web: <http://localhost:3000>
- API: <http://localhost:8000> (interactive docs at `/docs`, health at `/health`)

On startup the API **auto-creates all tables** (`Base.metadata.create_all`) and
**seeds the attorney account** — there is no migration or seed command to run.

See the emails: the default `console` email backend logs both messages to the
API container's stdout.

```bash
docker compose logs -f api
```

## Option B — Manual (Postgres via Docker, apps on host)

### Prerequisites

- Python 3.11+
- Node 18+
- Docker (for Postgres only)

### 1. Start Postgres

```bash
docker compose up -d db
```

Runs Postgres 16 on `localhost:5433` (host port; configurable via `POSTGRES_HOST_PORT`) with user/password/db all `alma`.

### 2. Backend

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'        # runtime deps + pytest/httpx
cp ../../.env.example .env      # shipped DATABASE_URL already targets localhost:5433
uvicorn app.main:app --reload --port 8000
```

On the first request/startup the API creates its tables and seeds the attorney
user (idempotent). API docs: <http://localhost:8000/docs>.

#### Backend environment variables

Names are the UPPERCASE form of the fields in `apps/api/app/core/config.py`.

| Var | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://alma:alma@localhost:5432/alma` | code default; the shipped `.env.example` overrides to `localhost:5433` to match the compose db port |
| `JWT_SECRET` | `dev-secret-change-me` | change outside local dev |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_TTL_MINUTES` | `480` | access-token lifetime |
| `ATTORNEY_EMAIL` | `attorney@example.com` | seeded login |
| `ATTORNEY_PASSWORD` | `password123` | seeded login |
| `EMAIL_BACKEND` | `console` | `console` logs to stdout; `smtp` uses `SMTP_*` |
| `EMAIL_FROM` | `no-reply@example.com` | sender address |
| `ATTORNEY_NOTIFY_EMAIL` | `attorney@example.com` | recipient of new-lead notifications |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_USE_TLS` | `localhost` / `1025` / — / — / `false` | only when `EMAIL_BACKEND=smtp` |
| `STORAGE_BACKEND` | `local` | local-disk backend |
| `UPLOAD_DIR` | `uploads` | where resumes are written |
| `MAX_RESUME_BYTES` | `10485760` | 10 MB upload cap |
| `PUBLIC_API_URL` | `http://localhost:8000` | used to build resume links |
| `WEB_ORIGIN` | `http://localhost:3000` | CORS origin |

### 3. Frontend

```bash
cd apps/web
npm install
npm run dev
```

App at <http://localhost:3000>.

#### Frontend environment variables

| Var | Default (manual) | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | base URL the browser uses |
| `API_INTERNAL_URL` | `http://localhost:8000` | base URL the Next.js server uses (in Compose: `http://api:8000`) |

## Demo flow

1. Submit the form at `/` with a PDF/DOC resume — two emails print to the API
   console (`console` backend).
2. Log in at the login page with the seeded attorney credentials.
3. On `/dashboard`, open the resume and mark the lead `REACHED_OUT`.

## Tests

```bash
cd apps/api && pytest
```
