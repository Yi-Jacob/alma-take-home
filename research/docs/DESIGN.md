# Design Notes

## Shape

Two apps in one repo: `apps/api` (FastAPI) and `apps/web` (Next.js). The backend
owns all business logic; the frontend is a thin client. Layering in the API:

```
routers → services → repositories → db
              ↘ storage / email abstractions
```

Routers stay thin (validation + auth + delegation). Services orchestrate.
Repositories own queries. Routes never return ORM objects — Pydantic schemas only.

## Key decisions & tradeoffs

### Email after DB commit (no queue)
Requirement: don't lose a lead if email fails. The lead is committed first;
emails are sent afterward in a try/except. A nullable `notification_sent_at`
column records success — leads with `NULL` are inspectable and re-sendable.
The "real" solution is a transactional outbox + worker; deliberately skipped
as out of scope for a take-home. This gives an honest failure mode without
Celery/queue infrastructure.

### JWT + single seeded user
One attorney is a stated v1 assumption. Login verifies against a seeded user
(bcrypt) and issues a short-lived JWT. No refresh tokens, no roles, no user
management — all would be ceremony without a second user.

Frontend stores the JWT in a non-httpOnly cookie so Next.js middleware can
presence-check it for redirects. Production would use httpOnly cookies set by
the backend; this is a scoped decision, noted rather than hidden.

### Storage / email as protocols
`StorageBackend` and `EmailSender` are small Python protocols with local-disk
and console implementations. Swapping to S3/SES is a new class + env var, not
a refactor. Console email makes the demo runnable with zero external accounts.

### File handling
Uploads are validated (extension allowlist, size cap) and written to disk under
a server-generated UUID key — the client filename is stored for display only,
never used in the path.

### State machine
`PENDING → REACHED_OUT` is the only legal transition, enforced in the service
layer (409 on anything else). Enum has exactly two states per spec; no
speculative states added.

## What I deliberately did NOT build

- Queues/workers (outbox pattern named above, not implemented)
- S3 storage (abstraction exists; local disk for demo)
- Multi-user auth, roles, registration
- Lead dedupe by email (product policy question, not v1)
- Pagination (fine until lead count is real)

## What I'd do next for production

- Transactional outbox for emails
- httpOnly cookie auth issued by the backend
- S3 + presigned URLs for resumes
- Rate limiting on the public form
- Structured logging + error tracking
