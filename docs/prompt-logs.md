# Prompt Logs (Representative Excerpts)

Curated excerpts, not raw transcripts — the goal is to show how the agents were
directed, not to dump noise. All excerpts are from the real Claude Code session
(2026-07-03). Three subagents were fanned out in parallel from one orchestrator
session; each excerpt is the actual prompt text (trimmed).

## 1. Architecture scoping (Claude Code / Opus, plan mode)

The session started in plan mode. The orchestrator asked structured questions
instead of assuming:

> "Which storage backend should the app use to persist leads and resume files?"
> — Postgres + Docker (recommended) vs SQLite
>
> "How should the app deliver the two notification emails (to prospect +
> attorney)?" — Pluggable with console default (recommended) vs MailHog vs real
> provider
>
> "How should the internal leads UI be protected by auth?" — JWT + seeded
> attorney (recommended) vs NextAuth vs HTTP Basic

The human's answers (plus a `research/` folder of design notes) locked in:
Postgres, pluggable console-default email, single seeded attorney with JWT, and
a strict "what NOT to build" list (no search/filter, roles, queues, resume
parsing, pagination).

## 2. Backend subagent prompt (excerpt)

The foundation (config, models, security, schemas, storage/email protocols) was
written by hand first, then this prompt handed the rest to a subagent:

> "You are completing a production-shaped FastAPI backend for a lead-management
> app. Work ONLY inside `apps/api`. …
>
> `create_lead(db, *, data, resume_bytes, resume_filename, content_type)` —
> Flow (ORDER MATTERS — this satisfies 'never lose a lead if email fails'):
> (a) validate content_type / size … (b) storage.save() the bytes …
> (c) build Lead(state=PENDING, …) → add, COMMIT, refresh. (d) THEN send both
> emails inside try/except. On success set `lead.notification_sent_at` and
> commit. On failure: log the exception, DO NOT raise, leave
> `notification_sent_at` NULL. The lead is already persisted and must be
> returned successfully. …
>
> `set_state` — ONLY PENDING→REACHED_OUT is legal. … map LeadNotFound→404,
> IllegalStateTransition→409. …
>
> Tests MUST pass with NO external services: in-memory SQLite with StaticPool,
> override `get_db`, force EMAIL_BACKEND=console and a temp UPLOAD_DIR. …
> Definition of done: `pytest` → ALL GREEN. Iterate until green."

## 3. Frontend subagent prompt (excerpt)

> "Build the Next.js frontend … The backend is a separate FastAPI service — you
> integrate against the fixed HTTP contract below; do NOT read or depend on
> backend code. …
>
> Auth pattern (BFF, httpOnly cookie — secure): The token must NEVER be exposed
> to client JS. `app/api/auth/login/route.ts` calls the FastAPI login and sets
> an httpOnly `access_token` cookie … `middleware.ts`: for `/dashboard/:path*`,
> if no cookie → redirect to `/login`. `/dashboard` is a SERVER component: read
> the cookie via `cookies()`, fetch leads server-side with the Bearer header
> (cache: 'no-store') … 'Mark reached out' as a server action that PATCHes
> `{state:"REACHED_OUT"}` then `revalidatePath('/dashboard')`. …
>
> Definition of done: `npm run build` succeeds with no type/lint errors."

Giving the frontend agent only the HTTP contract (not the backend source) kept
the API boundary honest — any mismatch would surface at integration, not be
papered over by reading the other side's code.

## 4. Infra / docs subagent prompt (excerpt)

> "Produce the infrastructure and documentation … There is a `research/` folder
> containing TEMPLATE docs full of placeholders. Use them as the SOURCE/skeleton
> but produce final, accurate docs. …
>
> Document what was ACTUALLY built — sync SQLAlchemy, `create_all` not Alembic
> (document Alembic as a 'next step', do not claim it's used) … the research
> template said non-httpOnly cookie; correct it to httpOnly and explain why. …
>
> Definition of done: `docker compose config` parses without error. All docs
> internally consistent with the architecture and with each other."

The "document only what's true" framing mattered: the agent's report explicitly
flagged what it could not verify (Dockerfiles and frontend routes still being
built by the other two agents) instead of asserting them.
