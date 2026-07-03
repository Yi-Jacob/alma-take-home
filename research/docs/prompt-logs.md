# Prompt Logs (Representative Excerpts)

Curated excerpts, not raw transcripts — the goal is to show how AI was directed,
not to dump noise.

## 1. Architecture scoping (Claude)

> "Propose a lean architecture for a 6-hour take-home... Recommend the simplest
> auth approach that still looks credible... Call out what NOT to build so I
> don't over-scope."

Used the output to fix scope before writing code: SQLite→Postgres was the one
change I made to its suggestion; kept single-user JWT, console email, local storage.

## 2. Backend structure (Claude)

> "Generate a production-shaped FastAPI backend... Thin routers, business logic
> in services, persistence in repositories... If email fails after the DB insert
> succeeds, do not lose the lead."

The email-failure constraint came from me; the `notification_sent_at` approach
came out of this exchange and I adopted it over BackgroundTasks after
understanding the session-lifetime issue.

## 3. Implementation prompt (Cursor) — example

> [PASTE ONE OR TWO OF YOUR REAL CURSOR PROMPTS, e.g.:]
> "Implement `lead_service.py` per the structure in app/services. Constructor
> takes storage + email via DI. Flow: validate file → storage.save → repo.create
> → commit → try/except email sends → set notification_sent_at on success.
> Raise 409 for illegal state transitions in update_state."

## 4. Frontend plan (Claude)

> "Build the frontend plan... what state should live in forms/components vs
> shared hooks... the easiest way to make the internal dashboard look credible fast."

Adopted: component-local state, no form library, cookie-based token for
middleware presence checks.

[Add 1–2 more real excerpts — especially any where you rejected or corrected output.]
