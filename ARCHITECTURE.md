# Architecture Note

## Goal and framing

The brief is intentionally open-ended. Rather than thinly imitating many Google
Docs features, I picked a coherent **product slice** and built it with real
depth: create/edit/rename rich-text documents, import files, and share them with
a clear owner/collaborator access model that is correct and enforced on the
server. Everything persists and survives refresh, and the whole thing ships as a
single deployable artifact.

## High-level shape

```
React SPA (TipTap)  --/api + JWT-->  NestJS API  -->  SQLite (TypeORM)
        ^                                  |
        +------ served as static assets ---+   (single process in production)
```

One NestJS process owns persistence, auth, validation, and (in production) also
serves the built React bundle. This keeps deployment to **one container on one
port**, which is the simplest reliable thing to review.

## Key decisions and why

1. **NestJS + TypeORM + SQLite.** Nest's module system makes the access-control
   boundaries explicit and testable. SQLite needs no external service, so a
   reviewer can run everything with `npm install` + two commands, and the same
   file-based store works inside Docker via a mounted volume.

2. **Rich text persisted as sanitized HTML.** TipTap emits HTML directly, so
   storing HTML keeps the round-trip simple and the data human-readable. Every
   write passes through a strict `sanitize-html` allow-list
   ([backend/src/common/sanitize.ts](backend/src/common/sanitize.ts)), so a
   shared document can never carry scripts or inline handlers to another user.
   This is verified by a unit test that strips an injected `<script>`.

3. **Server-enforced access control.** The single source of truth is
   `DocumentsService.resolveAccess()` returning `owner | editor | viewer | null`
   ([backend/src/documents/documents.service.ts](backend/src/documents/documents.service.ts)).
   Read requires any access; edit requires `owner`/`editor`; delete and sharing
   require `owner`. The UI mirrors this (view-only banner, hidden Share button),
   but the UI is never trusted - all rules are checked in the service and
   covered by unit + e2e tests.

4. **Seeded users + JWT.** Per the chosen scope, auth is a simple
   email/password login over seeded accounts issuing a JWT. This is enough to
   demonstrate multi-user sharing without building a full signup/identity system.
   Passwords are bcrypt-hashed; the login path runs the hash comparison even for
   unknown emails to avoid user enumeration.

5. **Sharing model.** A `DocumentShare(documentId, userId, role)` row with a
   unique constraint represents access. Re-sharing updates the role (upsert),
   which makes "promote viewer to editor" a natural operation - exactly the path
   exercised by the e2e test.

6. **File import as a product action.** Upload turns a `.txt`/`.md`/`.docx` file
   into a brand-new editable document (Markdown via `marked`, DOCX via
   `mammoth`, plain text wrapped into paragraphs), then routes the user straight
   into the editor. Validation covers extension and a 5 MB size cap, both in the
   Multer filter and the service.

7. **Operational quality.** Structured request logging with `nestjs-pino`
   (auth headers redacted), a global validation pipe, and a global exception
   filter that returns a consistent JSON error envelope and logs 5xx vs 4xx at
   the right severity.

## Autosave UX

The editor debounces changes (~900 ms) and PATCHes title + content, surfacing a
"Saving… / All changes saved / Save failed (Retry)" indicator. This gives a
Docs-like feel without the complexity of real-time sync.

## What I deliberately deprioritized

- **Real-time collaborative editing (CRDTs / OT).** The highest-effort feature;
  out of scope for the timebox. The data model and autosave are a reasonable
  base to grow into it.
- **Comments / suggestion mode and version history.** Valuable but orthogonal to
  the core slice.
- **Full identity (self-serve signup, password reset, refresh tokens).** Seeded
  accounts keep reviewer setup trivial while still proving the sharing logic.
- **DB migrations.** TypeORM `synchronize` is used because the schema is small
  and single-file; production would switch to migrations.

## What I would do next with another 2-4 hours

1. Presence indicators ("Bob is viewing") via a lightweight WebSocket gateway.
2. Export to Markdown / PDF.
3. Per-collaborator activity (last edited by) and document search/sort.
4. Swap `synchronize` for migrations and add a `viewer`-can-comment tier.

## Notable tradeoffs / known limitations

- The frontend JS bundle is ~640 KB (TipTap + ProseMirror + React Query). Fine
  for this scope; would be code-split per route in a larger app.
- `synchronize: true` is convenient but not production-safe for evolving schemas.
- Autosave is last-write-wins; concurrent editors could overwrite each other
  (acceptable until real-time sync is added).
