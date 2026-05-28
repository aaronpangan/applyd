# Applyd

A personal job application tracker. Log the jobs you apply to, move them through
the hiring pipeline, keep append-only notes per job, schedule email reminders for
interviews, and see your search at a glance on a dashboard.

Built as a portfolio project — no monetization. The focus is clean UX, an
idiomatic fully-async FastAPI backend, and a modern Next.js frontend.

## Features

- **Google sign-in** — Google OAuth only; the backend verifies the Google
  `id_token` and issues its own JWT, stored in an HttpOnly cookie.
- **Job tracking** — create, edit, archive, restore, and (only once archived)
  permanently delete jobs. Duplicate detection warns on a repeated
  company + position.
- **Status pipeline** — `bookmarked → applied → phone_screen → tech_interview →
  final_interview → offer → accepted`, with `rejected` / `withdrawn` reachable
  at any point.
- **Notes** — append-only, honest chronological log per job.
- **Email reminders** — one or more scheduled reminders per job, sent by a
  background scheduler.
- **Dashboard** — stat cards, search, status/priority/work-setup filters, an
  archive view, and bulk archive.
- **Excel export** — export the jobs you're currently viewing to a styled
  `.xlsx` workbook (Summary + Jobs sheets); active and archived exports each
  have their own design.

## Tech Stack

### Frontend (`client/`)
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS |
| Auth helper | `@react-oauth/google` (obtains the Google `id_token` only) |
| API access | Next.js rewrite proxy — `/api/*` → FastAPI |
| Hosting | Vercel |

### Backend (`server/`)
| Layer | Technology |
|---|---|
| Framework | FastAPI (fully async) |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 (async mode) |
| DB driver | asyncpg |
| Migrations | Alembic |
| Auth | Google OAuth (JWKS verification) + app JWT in an HttpOnly cookie |
| Email | Resend / SendGrid (free tier) |
| Scheduler | APScheduler `AsyncIOScheduler`, embedded in FastAPI |
| Excel export | openpyxl (styled `.xlsx` generation) |
| Tooling | uv (packaging), Ruff (linting) |
