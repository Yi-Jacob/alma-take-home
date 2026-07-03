# Attribution Notes

Rough map of AI-assisted vs hand-written work. Commits are also tagged — see
"Commit conventions" below.

| Area | Origin | Notes |
|---|---|---|
| Architecture / scope | AI-proposed, human-decided | Final calls (Postgres, auth storage, no queue) were mine |
| DB models, migrations | AI draft → manual review | [note any edits you made] |
| Lead service | AI draft → manual restructure | [e.g. email/transaction ordering fixed manually] |
| Auth (JWT, seed) | AI draft → manual review | |
| Frontend form + dashboard | AI draft → manual polish | [e.g. responsive fixes, error mapping by hand] |
| Docs | AI-drafted, human-edited | This file included |
| [Debugging session X] | Manual | [your real item] |

## Commit conventions

Conventional Commits, with an attribution trailer where useful:

- `feat(api): lead submission endpoint with file upload` + trailer `AI-Assisted: cursor (reviewed)`
- `fix(api): commit lead before sending emails` — manual fix of AI output
- `docs: add design notes and run instructions`
