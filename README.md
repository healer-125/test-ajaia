# Ajaia Docs

A lightweight, Google-Docs-inspired collaborative document editor. Create and
rename documents, edit them with rich text, import files, and share documents
with teammates as viewers or editors.

Built as a Node monorepo:

- **Backend:** NestJS + TypeORM + SQLite, JWT auth, structured logging (pino)
- **Frontend:** React + Vite + TipTap (rich-text) + Tailwind CSS + React Query
- **Deployment:** a single Docker image where the API also serves the built SPA

---

## Features

| Capability       | What it does                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| Document editing | Create, rename, edit, autosave, and reopen documents                         |
| Rich text        | Bold, italic, underline, strikethrough, H1/H2, bullet & numbered lists, quote |
| File upload      | Import `.txt`, `.md`, or `.docx` (max 5 MB) into a new editable document      |
| Sharing          | Owner shares by email with a `viewer` or `editor` role; revoke any time      |
| Access model     | Clear split between "My documents" and "Shared with me"; view-only enforced  |
| Persistence      | SQLite; documents, formatting (sanitized HTML), and shares survive refresh   |

### Supported import file types

`.txt`, `.md` (Markdown), and `.docx`. Maximum size **5 MB**. Other types are
rejected with a clear message in the UI.

---

## Demo accounts

All seeded accounts share the password **`password123`**.

| Email             | Role in demo data                                |
| ----------------- | ------------------------------------------------ |
| `alice@ajaia.dev` | Owns the sample "Welcome" doc, shares it w/ Bob  |
| `bob@ajaia.dev`   | Has **editor** access to Alice's sample doc      |
| `carol@ajaia.dev` | A third user you can share documents with        |

On first boot the backend seeds these users and one shared sample document so
the sharing flow is immediately demonstrable.

---

## Prerequisites

- **Node.js 20+** (developed on Node 24) and npm 11+
- Optional: **Docker** (Docker Desktop must be *running*) for the container path

---

## Run locally (development)

From the repository root:

```bash
npm install
```

Start the backend and frontend in two terminals:

```bash
# Terminal 1 - API on http://localhost:3000
npm run dev:backend

# Terminal 2 - Vite dev server on http://localhost:5173 (proxies /api -> :3000)
npm run dev:frontend
```

Open **http://localhost:5173** and sign in with a demo account.

The SQLite database is created automatically at `./data/app.sqlite`.

### Environment variables (optional in dev)

Defaults are dev-friendly; copy `backend/.env.example` to `backend/.env` to override.

| Variable         | Default                  | Purpose                                   |
| ---------------- | ------------------------ | ----------------------------------------- |
| `PORT`           | `3000`                   | API port                                  |
| `JWT_SECRET`     | dev fallback             | JWT signing secret (set in production)    |
| `JWT_EXPIRES_IN` | `7d`                     | Token lifetime                            |
| `DATABASE_PATH`  | `../data/app.sqlite`     | SQLite file location                      |
| `SEED_PASSWORD`  | `password123`            | Password for all seeded demo accounts     |
| `FRONTEND_DIST`  | empty                    | When set, the API serves the SPA from here |

---

## Run with Docker (production-like)

Docker Desktop / engine must be running.

```bash
docker compose up --build
```

Then open **http://localhost:3000** (the API serves the built SPA on the same
port). The SQLite database is persisted in the `ajaia-data` named volume.

To build the image directly:

```bash
docker build -t ajaia-docs .
docker run -p 3000:3000 -e JWT_SECRET=please-change-me ajaia-docs
```

---

## Production build without Docker

```bash
npm run build                 # builds frontend (Vite) then backend (Nest)
FRONTEND_DIST="$(pwd)/frontend/dist" node backend/dist/main.js
```

The server then serves both the API (`/api/*`) and the SPA on `PORT`.

---

## Testing

```bash
npm test                              # backend unit tests + frontend tests
npm run test --workspace backend      # backend unit tests (Jest)
npm run test:e2e --workspace backend  # end-to-end sharing flow (Jest + supertest)
npm run test --workspace frontend     # frontend tests (Vitest + Testing Library)
```

What is covered:

- **Unit:** document access-control resolution (owner/editor/viewer/none) and
  HTML sanitization; share grant/revoke rules.
- **E2E:** Alice creates a doc, shares with Bob (viewer -> blocked from editing),
  upgrades Bob to editor (edit succeeds), and only the owner can delete.
- **Frontend:** the TipTap editor renders headings/lists and shows the toolbar
  only in editable mode.

---

## Troubleshooting

**`NODE_MODULE_VERSION` mismatch / `ERR_DLOPEN_FAILED` from `better-sqlite3`.**
This native module is compiled for a specific Node.js ABI. If you `npm install`
with one Node version but run the app with another, you'll see an error like
"compiled against a different Node.js version". Fix it by installing and running
with the **same** Node version (this repo pins Node 24 via `.nvmrc`):

```bash
nvm use            # or: nvm install 24 && nvm use 24
npm install        # re-fetches the matching prebuilt binary
# if a prebuilt is unavailable for your platform: npm rebuild better-sqlite3
```

## Project layout

```
ajaia/
  backend/    NestJS API (auth, documents, shares, upload, logging)
  frontend/   React + TipTap SPA
  Dockerfile          multi-stage build (frontend + backend -> single runtime)
  docker-compose.yml  one-command containerized run with a persistent volume
  ARCHITECTURE.md     priorities, tradeoffs, and what was deprioritized
  AI_WORKFLOW.md      how AI tools were used and verified
  SUBMISSION.md       manifest + working/incomplete/next steps
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions and tradeoffs.
