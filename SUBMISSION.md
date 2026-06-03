# Submission

## What this is

Ajaia Docs - a lightweight collaborative document editor (create, edit, rename,
import, share) built as a NestJS + React monorepo with SQLite persistence and a
single-container deployment.

## Included in this repository

| Item                       | Location                                              |
| -------------------------- | ----------------------------------------------------- |
| Source code (backend)      | [backend/](backend/)                                  |
| Source code (frontend)     | [frontend/](frontend/)                                |
| Setup & run instructions   | [README.md](README.md)                                |
| Architecture note          | [ARCHITECTURE.md](ARCHITECTURE.md)                    |
| AI workflow note           | [AI_WORKFLOW.md](AI_WORKFLOW.md)                       |
| This manifest              | [SUBMISSION.md](SUBMISSION.md)                         |
| Dockerfile (single image)  | [Dockerfile](Dockerfile)                              |
| Docker Compose             | [docker-compose.yml](docker-compose.yml)              |
| Backend unit tests         | `backend/src/**/*.spec.ts`                            |
| End-to-end test            | [backend/test/sharing.e2e-spec.ts](backend/test/sharing.e2e-spec.ts) |
| Frontend test              | [frontend/src/components/RichTextEditor.test.tsx](frontend/src/components/RichTextEditor.test.tsx) |

## To be provided at submission time

> Fill these in before sending the Google Drive folder.

- **Live product URL:** _<deploy via Docker to your platform of choice and paste the URL>_
- **Walkthrough video URL:** _<unlisted Loom/YouTube link, see VIDEO_LINK.txt>_
- **Google Drive folder:** _<link containing this repo + notes + video link>_

## Test / review accounts

All seeded accounts use password **`password123`**:

- `alice@ajaia.dev` - owns the sample document, shares it with Bob (editor)
- `bob@ajaia.dev` - has editor access to Alice's sample document
- `carol@ajaia.dev` - extra account to demonstrate sharing

## How to run quickly

```bash
npm install
npm run dev:backend     # http://localhost:3000
npm run dev:frontend    # http://localhost:5173
```

Or containerized (Docker engine must be running):

```bash
docker compose up --build   # http://localhost:3000
```

## What is working (end to end)

- Create, rename, edit (rich text), autosave, reopen documents
- Rich-text formatting: bold, italic, underline, strikethrough, H1/H2, bullet &
  numbered lists, blockquote
- Import `.txt`, `.md`, `.docx` (<= 5 MB) into a new editable document
- Share by email as `viewer` or `editor`; promote/revoke; owned vs shared lists
- Server-enforced access control (view-only enforced; owner-only delete/share)
- Persistence in SQLite (survives refresh and restart via Docker volume)
- JWT auth over seeded accounts; structured logging; validation; error envelope
- 18 passing automated tests (unit + e2e + frontend) and a single-image build

## What is incomplete / intentionally deprioritized

- No real-time multi-user editing (autosave is last-write-wins)
- No comments/suggestions or version history
- No self-serve signup / password reset (seeded accounts only)
- Uses TypeORM `synchronize` instead of migrations

## What I would build next with another 2-4 hours

1. Presence indicators via a WebSocket gateway
2. Export to Markdown / PDF
3. Document search/sort and "last edited by" metadata
4. Migrations and a comment-capable role tier

## Notes for reviewers

- The Docker image build requires the Docker engine/daemon to be running. The
  production serving path (API + SPA on one port, with SPA route fallback) was
  verified directly by running the built server with `FRONTEND_DIST` set.
