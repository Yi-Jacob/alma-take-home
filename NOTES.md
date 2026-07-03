# Attribution Notes

Rough map of hand-written vs agent-generated work. Commits are also tagged — see
"Commit conventions" below.

The build used **Claude Code (Opus)** as an orchestrator driving three parallel
subagents (backend, frontend, infra/docs). The foundation files were written by
hand first; the subagents built on top of them and their output was reviewed
before commit.

| Area | Origin | Notes |
|---|---|---|
| Architecture / scope | AI-proposed, human-decided | Final calls (sync SQLAlchemy, Postgres, `create_all` over Alembic, single-user JWT, httpOnly-cookie BFF) were the human's |
| Backend foundation (config, models, DB session, security/JWT, schemas, storage & email protocol interfaces) | **Hand-written** | The contracts the subagents built against |
| Backend completion (lead service, routers, seed, app wiring) | Backend subagent → human-reviewed | Email-after-commit / `notification_sent_at` ordering verified by hand |
| Frontend (form, login BFF, dashboard, middleware) | Frontend subagent → human-reviewed | httpOnly cookie set server-side; token never exposed to client JS |
| Infra (`docker-compose.yml`, `.env.example`, `.gitignore`) | Infra/docs subagent → human-reviewed | Zero-setup `docker compose up` |
| Docs (README, RUN_LOCAL, DESIGN, AGENT_USAGE, prompt-logs, this file) | Infra/docs subagent → human-reviewed | Adapted from the research templates against the real code |
| Integration + end-to-end verification | **Manual** | Running the stack and confirming the demo flow |

## Commit conventions

[Conventional Commits](https://www.conventionalcommits.org/), with an
`AI-Assisted:` trailer where useful to record provenance:

- `feat(api): lead submission endpoint with file upload`
  + trailer `AI-Assisted: claude-code (backend subagent, reviewed)`
- `fix(api): commit lead before sending emails` — manual fix of agent output
- `feat(web): httpOnly-cookie login BFF`
  + trailer `AI-Assisted: claude-code (frontend subagent, reviewed)`
- `docs: add design notes and run instructions`
  + trailer `AI-Assisted: claude-code (infra/docs subagent, reviewed)`
