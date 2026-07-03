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
schema and serializer; the test suite (16 tests) stayed green and the field now
returns a real timestamp.

Two smaller catches worth noting: `docker compose up` failed because the
compose file published Postgres on host port 5432, which collided with a
Postgres already running on this machine — fixed by making the host port
configurable (`POSTGRES_HOST_PORT`, default 5433) and updating the docs to
match. And the research-template docs proposed a non-httpOnly auth cookie "so
middleware can read it"; middleware only needs presence, which httpOnly cookies
satisfy, so the frontend was directed to use httpOnly and the design doc
corrected.

## Prompt logs

Representative excerpts in [prompt-logs.md](prompt-logs.md). Attribution per area
in [NOTES.md](../NOTES.md).
