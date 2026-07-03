# Design Notes

## Shape

Two apps in one repo: `apps/api` (FastAPI) and `apps/web` (Next.js). The backend
owns all business logic; the frontend is a thin client. Layering in the API:

```
routers → services → models → db
              ↘ storage / email protocols
```

Routers stay thin: they validate input, enforce auth, and delegate. Services
orchestrate business rules (validation, persistence, email, state transitions).
Routes never return ORM objects — they serialize through Pydantic schemas.

## Persistence: sync SQLAlchemy, tables via `create_all`

The API uses **synchronous** SQLAlchemy 2.0 over Postgres with the `psycopg`
(v3) driver. Sync keeps the request path simple — no async session lifetime
gotchas — and there is no throughput requirement here that async would help.

Schema is created on startup with `Base.metadata.create_all(engine)`; the same
startup hook seeds the attorney account (idempotent). This makes the demo run
with zero migration steps. **Alembic is a deliberate next step, not something in
use today** — see "What I'd do next".

## Key decisions & tradeoffs

### Email after DB commit (no queue)

Requirement: never lose a lead if email fails. In `create_lead` the lead is
committed **first**; the two emails are sent **afterward** inside a `try/except`.
On success a nullable `notification_sent_at` timestamp is set; on failure the
exception is logged and the column stays `NULL` — the lead is still stored and
returned successfully. Leads with `NULL` are inspectable and could be re-sent.

The "real" solution is a transactional outbox + worker; deliberately skipped as
out of scope. This gives an honest, observable failure mode without adding
Celery/queue infrastructure.

### JWT + single seeded user

One attorney is a stated v1 assumption. Login verifies email/password against a
seeded user (bcrypt) and issues a short-lived JWT (pyjwt, HS256). No refresh
tokens, no roles, no registration — all ceremony without a second user. The API
guards `GET /leads`, `GET /leads/{id}`, and `PATCH /leads/{id}/state` with a
`Bearer` token.

### httpOnly-cookie BFF on the frontend

The frontend uses a backend-for-frontend pattern. A Next.js **route handler**
takes the login form, calls the API, and on success sets the JWT in an
**httpOnly** cookie (`access_token`). Middleware presence-checks that cookie to
guard `/dashboard`, and the dashboard (a server component) reads the cookie
server-side and forwards the token as a `Bearer` header when calling the API.

The token is **never exposed to client-side JavaScript**. This is stronger than
a JS-readable cookie: an httpOnly cookie is not reachable from `document.cookie`,
which removes the XSS token-theft path. The only tradeoff is that all
authenticated API calls are proxied through the Next.js server rather than made
directly from the browser — an acceptable and, for this app, desirable default.

### Storage / email as protocols

`StorageService` and `EmailService` are small Python `Protocol`s. Storage ships
a local-disk implementation (S3 would be a new class plus an env var, not a
refactor). Email ships three backends selected by `EMAIL_BACKEND`: `console`
(default — logs both messages so the demo runs with zero external accounts),
`resend` (real delivery through the Resend REST API via stdlib urllib, no extra
dependency), and `smtp` (stdlib smtplib). The factory proves the protocol pays
for itself: adding Resend touched no business logic.

### File handling

Uploads are validated (content-type allowlist, size cap, non-empty) and written
to disk under a **server-generated UUID key**. The original client filename is
stored for display only and is never used to build a path. Resumes are served
back through `GET /api/v1/leads/resumes/{key}`.

### State machine

`PENDING → REACHED_OUT` is the only legal transition, enforced in the service
layer — anything else raises and the API returns **409**. The enum has exactly
two states per spec; no speculative states were added.

## API surface

- `GET /health` — liveness
- `POST /api/v1/leads` — public, multipart (first_name, last_name, email, resume)
- `GET /api/v1/leads/resumes/{key}` — public resume download
- `POST /api/v1/auth/login` — issue JWT
- `GET /api/v1/leads` — auth-guarded, list
- `GET /api/v1/leads/{id}` — auth-guarded, detail
- `PATCH /api/v1/leads/{id}/state` — auth-guarded, transition (409 if illegal)

## What I deliberately did NOT build

- Queues/workers (outbox pattern named above, not implemented)
- Alembic migrations (tables via `create_all` for now)
- S3 storage (protocol exists; local disk for the demo)
- Multi-user auth, roles, registration
- Lead dedupe by email (a product-policy question, not v1)
- Pagination (fine until lead volume is real)

## What I'd do next for production

- Alembic migrations instead of `create_all`
- Transactional outbox + worker for emails (retry the `NULL` ones)
- S3 + presigned URLs for resumes
- Rate limiting on the public form
- Structured logging + error tracking
