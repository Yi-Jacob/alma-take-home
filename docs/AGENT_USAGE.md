# AI Tooling Usage

Being transparent about how AI tools were used, since it materially shaped how
fast this was built.

## Tools

- **Claude Code (Opus)** — the primary agent and orchestrator. It planned the
  architecture and then drove a **fan-out of parallel subagents**, one per area:
  - a **backend** subagent (endpoints, services, seed, wiring)
  - a **frontend** subagent (form, login BFF, dashboard, middleware)
  - an **infra/docs** subagent (docker-compose, env, README, docs)

## How the work was split

**Hand-written by the human/orchestrator** (the foundation everything else built
on top of):

- Backend config (`app/core/config.py`) and settings surface
- SQLAlchemy models (`Lead`, `User`) and the DB session/engine setup
- Security/JWT helpers (`app/core/security.py`) and bcrypt hashing
- Pydantic schemas (auth + lead)
- Storage and email **protocol interfaces** (`StorageService`, `EmailService`)
- All integration, review, and end-to-end verification of the running stack

**Delegated to the subagents** (the bulk of the implementation on top of that
foundation):

- Backend: the lead service flow, routers, seed, and app wiring
- Frontend: the public form, the httpOnly-cookie login BFF, dashboard, middleware
- Infra/docs: `docker-compose.yml`, `.env.example`, `.gitignore`, README, and
  these docs

## Review process

Agent output was treated like a PR from a fast junior engineer: read fully,
run locally, and edited before committing. The hand-written foundation defined
the contracts (schemas, protocols, models) so the subagents produced code that
fit rather than drifted. Nothing was committed unread.

## A bad output I caught

A subtle contract drift, caught during the integration curl pass: the API's 201
response was silently missing `notification_sent_at`. The docs and the
frontend's `LeadRead` TypeScript type both declared the field (it's the audit
trail for "did the emails actually go out"), and the backend subagent's service
correctly *wrote* it to the DB — but the hand-written Pydantic `LeadRead`
schema predated the field, and the subagent's `to_read()` serializer faithfully
mirrored that schema instead of the model, so the field never left the API.
Every individual piece looked right; only comparing the real HTTP response
against the documented contract exposed it. Fixed by adding the field to the
schema and serializer; the test suite stayed green and the field now returns a
real timestamp.

## Post-build audit (Cursor)

After the initial build, three parallel audit agents (backend, frontend, infra)
reviewed the repo. All Blocker/High findings were fixed: 413 pre-read upload
guard, `with_for_update` on state transitions, storage path traversal rejection,
cookie/JWT TTL alignment, dashboard error boundary, and client-side upload
limits. Twenty additional tests were added (36 total). Intentional trade-offs
are listed in [AUDIT_HANDOFF.md](AUDIT_HANDOFF.md).

A follow-up product pass aligned terminology across the UI and emails
("assessment request" not "application"), improved resume upload feedback,
and clarified the attorney workflow on the dashboard.

## Prompt logs

Representative excerpts in [prompt-logs.md](prompt-logs.md). Attribution per area
in [NOTES.md](../NOTES.md).
