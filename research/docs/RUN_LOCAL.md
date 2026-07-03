# Running Locally

## Prerequisites

- Python 3.11+
- Node 18+
- Docker (for Postgres)

## 1. Start Postgres

```bash
docker compose up -d
```

Runs Postgres 16 on `localhost:5432` (see `docker-compose.yml` for credentials).

## 2. Backend

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt        # or: pip install -e .
cp .env.example .env
alembic upgrade head
python -m app.db.seed                  # creates the attorney user (idempotent)
uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### Backend env vars (`apps/api/.env`)

| Var | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/leads` | |
| `JWT_SECRET` | — | required; any long random string locally |
| `JWT_EXPIRES_MINUTES` | `60` | |
| `SEED_ATTORNEY_EMAIL` | `attorney@example.com` | |
| `SEED_ATTORNEY_PASSWORD` | `changeme` | |
| `ATTORNEY_NOTIFY_EMAIL` | `attorney@example.com` | recipient of new-lead notifications |
| `EMAIL_BACKEND` | `console` | `console` logs emails to stdout; `smtp` uses vars below |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | — | only if `EMAIL_BACKEND=smtp` |
| `UPLOAD_DIR` | `./uploads` | |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | CORS |

## 3. Frontend

```bash
cd apps/web
npm install
cp .env.local.example .env.local       # sets NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

App at http://localhost:3000

## 4. Demo flow

1. Submit the form at `/` with a PDF resume — two emails print to the API console.
2. Log in at `/login` with the seeded attorney credentials.
3. View the lead on `/dashboard`, open the resume, mark it `REACHED_OUT`.

## Tests

```bash
cd apps/api && pytest
```
