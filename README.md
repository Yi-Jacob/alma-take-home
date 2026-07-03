# Lead Management App

A small lead-intake system: prospects submit their name and a resume through a
public form; a single attorney logs in to review leads and mark them as reached
out. Every submission triggers two emails (a confirmation to the prospect and a
notification to the attorney).

## Stack

- **Backend** — FastAPI, SQLAlchemy 2.0 (sync), PostgreSQL, psycopg
- **Frontend** — Next.js (App Router), TypeScript, Tailwind
- **Email** — pluggable sender; **console** backend by default (logs to API stdout), SMTP via env
- **Storage** — pluggable backend; local disk by default (UUID keys)
- **Auth** — JWT (pyjwt), single seeded attorney user, bcrypt; httpOnly-cookie BFF on the frontend

## Repo layout

```
apps/api    FastAPI backend (schema auto-created on startup, no Alembic yet)
apps/web    Next.js frontend
docs/       Design notes, run instructions, AI-tooling disclosure
```

## Quick start (one command)

```bash
docker compose up
```

This builds and starts three services: Postgres, the API on
<http://localhost:8000> (docs at `/docs`), and the web app on
<http://localhost:3000>. On startup the API auto-creates its tables and seeds
the attorney account — no migration or seed step to run. Defaults are baked in,
so no `.env` is required; copy `.env.example` to `.env` to override anything.

## Seeded login

```
email:    attorney@example.com
password: password123
```

(Configurable via `ATTORNEY_EMAIL` / `ATTORNEY_PASSWORD`.)

## Demo flow

1. Open <http://localhost:3000> and submit the form with a PDF/DOC resume.
2. Watch the two emails print to the API log:
   ```bash
   docker compose logs -f api
   ```
   (The default `console` email backend logs both messages to stdout.)
3. Log in with the seeded attorney credentials.
4. On the dashboard, open the resume and mark the lead **REACHED_OUT**.

## Docs

- [Run locally](docs/RUN_LOCAL.md) — Docker one-liner and the manual path
- [Design & tradeoffs](docs/DESIGN.md) — what was built and why
- [AI tooling usage](docs/AGENT_USAGE.md) — how agents were used
- [Prompt logs](docs/prompt-logs.md) — representative prompt excerpts
- [Attribution notes](NOTES.md) — hand-written vs agent-generated
