# AI Tooling Usage

Being transparent about how AI tools were used, since it materially shaped how
fast this was built.

## Tools

- **Claude** — architecture planning, scoping, doc drafting
- **Cursor** — in-editor implementation from structured prompts
- [adjust to your actual toolset]

## How I split the work

**Delegated to AI:**
- Initial architecture proposal and scope-cutting (what NOT to build)
- Boilerplate: Alembic setup, Pydantic schemas, fetch wrapper, UI primitives
- First drafts of the lead service and dashboard table

**Done/decided manually:**
- Final architecture calls (email-after-commit strategy, auth storage tradeoff)
- All code review — every AI-generated file was read and edited before commit
- [your real items: e.g. debugging X, restructuring Y]

## Review process

AI output was treated like a PR from a fast junior engineer: read fully,
tested locally, and edited before committing. Nothing was committed unread.

## A bad output I caught

[REPLACE WITH YOUR REAL EXAMPLE. Placeholder pattern:]
Cursor's first pass at the lead submission flow sent emails inside the same
DB transaction as the insert — an email failure would have rolled back the
lead, directly violating the "don't lose the lead" requirement. I restructured
it to commit first, then send with error capture (`notification_sent_at`).

## Prompt logs

Representative excerpts in [prompt-logs.md](prompt-logs.md). Attribution per
area in [NOTES.md](../NOTES.md).
