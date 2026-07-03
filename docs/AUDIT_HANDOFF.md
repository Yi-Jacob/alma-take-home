# Audit Handoff — Context for a Fresh Reviewer (Human or LLM)

Everything needed to audit this repo with zero ramp-up. Accurate as of 2026-07-03.

## What this is

A take-home: lead-intake app for an immigration law firm. Prospects submit a
public form (first name, last name, email, resume). The app persists the lead
(`PENDING`), emails the prospect and an internal attorney, and exposes an
auth-guarded dashboard where an attorney marks leads `REACHED_OUT`. That is the
entire product scope — anything beyond it is deliberately out of scope (see
"Known trade-offs").

## Architecture (one paragraph)

Monorepo. `apps/api` — FastAPI, **sync** SQLAlchemy 2.0, Postgres (psycopg v3);
layering: routers → services → protocol-based storage/email backends; schema via
`Base.metadata.create_all` on startup (no Alembic); one attorney user seeded on
startup. `apps/web` — Next.js App Router, TypeScript, Tailwind; public form is
a client component POSTing multipart straight to the API; internal auth uses a
BFF pattern (login route handler stores the FastAPI JWT in an httpOnly cookie;
middleware presence-checks it for `/dashboard`; the dashboard server component
forwards it as a Bearer header). `docker-compose.yml` runs db + api + web.

## Request flows

**Public submission:** `/` → `LeadForm.tsx` → `POST {API}/api/v1/leads`
(multipart) → router validates size (413 before body read) + fields (422) →
`services/leads.create_lead`: validate type/size/empty → `storage.save`
(UUID-hex key, client filename stored for display only) → commit lead
`PENDING` (on commit failure the stored file is deleted) → **after commit** send
prospect + attorney emails in try/except → success sets `notification_sent_at`,
failure logs and leaves it NULL (lead survives either way) → 201 `LeadRead`.

**Attorney flow:** `/login` → `POST /api/auth/login` (Next BFF) →
`POST {API}/api/v1/auth/login` → JWT → httpOnly cookie (8h, mirroring the API's
480-min TTL) → `/dashboard` (server component, `cache:'no-store'`, 401 →
redirect `/login`) → "Mark reached out" server action → `PATCH
{API}/api/v1/leads/{id}/state {"state":"REACHED_OUT"}` → service re-reads the
row `with_for_update` → only `PENDING→REACHED_OUT` legal, else 409 →
`revalidatePath('/dashboard')`.

## File map (where to look for what)

| Concern | Files |
|---|---|
| Settings/env | `apps/api/app/core/config.py` (env names = UPPERCASE field names) |
| JWT + bcrypt | `apps/api/app/core/security.py`, guard dep in `app/api/deps.py` |
| Models / state enum | `apps/api/app/models/lead.py` (`PENDING`, `REACHED_OUT` only), `user.py` |
| Lead business logic | `apps/api/app/services/leads.py` (create/list/get/set_state) |
| Email backends | `apps/api/app/services/email/` (console default, smtp opt-in; bodies in `notifications.py`) |
| Storage | `apps/api/app/services/storage/` (local disk; `path_for` rejects `/`, `\\`, `..`) |
| Routers | `apps/api/app/api/v1/{leads,auth,health}.py` (`to_read()` builds `resume_url`) |
| Tests | `apps/api/tests/` (in-memory SQLite StaticPool, no external services) |
| Public form | `apps/web/app/LeadForm.tsx` (client 10MB pre-check, 422 detail parsing) |
| Auth BFF | `apps/web/app/api/auth/{login,logout}/route.ts`, `middleware.ts` |
| Dashboard | `apps/web/app/dashboard/{page.tsx,actions.ts,ReachOutButton.tsx,error.tsx}` |
| API base URLs | `apps/web/lib/api.ts` (`NEXT_PUBLIC_API_URL` browser / `API_INTERNAL_URL` server) |
| Infra | `docker-compose.yml` (db host port **5433**), `apps/*/Dockerfile` |

## API contract

- `GET /health` → `{"status":"ok"}`
- `POST /api/v1/leads` — public multipart: `first_name`, `last_name`, `email`, `resume` → 201 / 413 / 422
- `GET /api/v1/leads/resumes/{key}` — public download (unguessable UUID key; see trade-offs)
- `POST /api/v1/auth/login` — `{email,password}` → `{access_token, token_type}` / 401
- Bearer-guarded: `GET /api/v1/leads`, `GET /api/v1/leads/{id}`, `PATCH /api/v1/leads/{id}/state` → 200 / 401 / 404 / 409
- `LeadRead`: id, first_name, last_name, email, resume_filename, resume_url, state, created_at, updated_at, reached_out_at, reached_out_by, notification_sent_at

Seeded login: `attorney@example.com` / `password123`.

## How to verify E2E

```bash
docker compose up --build          # db :5433, api :8000, web :3000
cd apps/api && source .venv/bin/activate && python -m pytest   # all green expected
```
Browser: submit at `/` → two emails in `docker compose logs api` → `/dashboard`
redirects to `/login` when logged out → log in → lead listed `PENDING` → "Mark
reached out" → badge flips, second attempt impossible (button gone; API would 409).

## Known trade-offs (intentional — do not re-flag as bugs)

- **No Alembic** — `create_all` on startup; migrations named as the production next step in DESIGN.md.
- **No queue/outbox** — emails sent inline post-commit; `notification_sent_at` NULL = not (fully) delivered. Partial success (prospect sent, attorney failed) is indistinguishable from none — known, documented, re-send is not idempotent.
- **Resume download is unauthenticated** — key is UUID hex (not enumerable), download forced as attachment. PII-vs-simplicity trade-off; production answer is signed URLs.
- **Content type trusted from client** — extension/MIME allowlist only, no magic-byte sniffing. Mitigated by attachment disposition and server-generated keys.
- **Weak dev defaults** (`JWT_SECRET`, seeded password) — acceptable locally; would need startup guards in production.
- **Single user, no roles/refresh tokens/pagination/dedupe** — v1 scope decision.
- **Deprecated `@app.on_event("startup")`** — works; lifespan migration is cosmetic.
- **Cookie `secure` flag gated on NODE_ENV** — fine for the demo; TLS-terminating proxy nuance noted.

## Audit history

Three prior audit passes (backend correctness/security, frontend/UX, infra/docs)
ran on 2026-07-03; all Blocker/High findings and most Medium ones were fixed:
oversized-upload memory DoS (413 pre-read), non-atomic state transition
(`with_for_update`), storage-key traversal guard, orphaned-file cleanup on
commit failure, `NEXT_PUBLIC_API_URL` as a Docker build arg, cookie/JWT TTL
alignment, 401-in-server-action → cookie cleared + redirect, dashboard error
boundary, client-side 10MB check, field-named 422 messages, doc corrections.
The list above ("Known trade-offs") is what was consciously left.
