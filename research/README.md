# Lead Management App

> **Superseded.** Planning templates from the initial agent session.
> The authoritative docs are in `/docs` and `/README.md`. Do not follow the
> quick-start here — it describes an earlier draft (async SQLAlchemy, Alembic).

A small lead-intake system: prospects submit their info and a resume via a public
form; an internal attorney reviews leads and marks them as reached out.

## Stack

- **Backend** — FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, Alembic
- **Frontend** — Next.js (App Router), TypeScript, Tailwind
- **Email** — pluggable sender (console backend for local dev)
- **Storage** — pluggable backend (local disk for local dev)
- **Auth** — JWT, single seeded attorney user

## Features

- Public lead form: first name, last name, email, resume upload
- Confirmation email to prospect + notification email to attorney
- Authenticated dashboard listing all leads
- Lead state: `PENDING` → `REACHED_OUT` (manual, attorney-only)

## Repo Layout

```
apps/api    FastAPI backend
apps/web    Next.js frontend
docs/       Design notes, setup, AI-tooling disclosure
```

## Docs

- [Run locally](docs/RUN_LOCAL.md)
- [Design & tradeoffs](docs/DESIGN.md)
- [AI tooling usage](docs/AGENT_USAGE.md)
- [Prompt logs](docs/prompt-logs.md)
- [Attribution notes](NOTES.md)

## Quick Start

See [docs/RUN_LOCAL.md](docs/RUN_LOCAL.md). Short version:

```bash
docker compose up -d          # Postgres
cd apps/api && alembic upgrade head && python -m app.db.seed && uvicorn app.main:app --reload
cd apps/web && npm install && npm run dev
```

Login: `attorney@example.com` / password from `.env` seed vars.
