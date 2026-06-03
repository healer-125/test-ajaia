# AI-Native Workflow Note

## Tools used

- **Cursor** with a Claude-based agent as the primary pair-programmer for
  scaffolding, writing modules, and drafting tests and docs.
- The model's knowledge of NestJS, TypeORM, TipTap, and Vite/Tailwind v4 APIs to
  avoid boilerplate lookups.

## Where AI materially sped things up

- **Scaffolding the monorepo** (workspaces, NestJS module/provider wiring,
  Vite + Tailwind v4 + Vitest config) - the repetitive plumbing was generated in
  minutes instead of hand-typing.
- **CRUD + DTOs + access-control service** - the shape of controllers, DTOs with
  `class-validator`, and the `resolveAccess` logic were drafted quickly, letting
  me focus review effort on the correctness of the permission rules.
- **Tests** - unit tests (with mocked repositories) and the supertest e2e flow
  were generated from a clear description of the behavior I wanted, then run.
- **Documentation** - first drafts of the README and this note.

## What I changed or rejected from AI output

- **Express 5 wildcard syntax.** Initial static-serving config used the old
  `'/api/*'` exclude pattern. Under Express 5 / path-to-regexp v8 that is
  invalid; I changed it to `'/api/{*path}'` and verified the SPA fallback works.
- **Vite vs Vitest type clash.** The single combined `vite.config.ts` with a
  `test` block failed `tsc -b` because Vitest pulls its own nested Vite types. I
  split the config into `vite.config.ts` (build) and `vitest.config.ts` (tests,
  excluded from the project `tsconfig`) instead of suppressing the error.
- **JWT `expiresIn` typing.** The `@nestjs/jwt` types expect a templated string;
  I corrected the factory typing rather than leaving an implicit `any`.
- **Underline extension.** TipTap StarterKit v2 does not include underline, so I
  added `@tiptap/extension-underline` explicitly to meet the requirement.
- **Login enumeration.** I made the login path run the bcrypt comparison even
  for unknown emails so response timing doesn't leak which accounts exist.

## How I verified correctness, UX, and reliability

- **Ran everything, did not assume.** Built both workspaces, booted the API, and
  exercised endpoints with `curl`: health, login (good and bad credentials), and
  the owned-vs-shared document listing for two different users.
- **Automated tests as the safety net.** 14 backend unit tests, a 2-case
  end-to-end sharing test (viewer blocked from editing -> upgraded to editor ->
  can edit -> only owner can delete), and 2 frontend rendering tests. All pass.
- **Verified the production serving path** directly: ran the built backend with
  `FRONTEND_DIST` set and confirmed `/` and a deep client route (`/doc/abc`)
  both return the SPA while `/api/*` stays under API control and enforces auth.
- **Security review of generated code:** confirmed HTML sanitization on every
  write (with a test injecting `<script>`), redaction of auth headers in logs,
  and server-side enforcement of all access rules independent of the UI.

The guiding principle: AI accelerated the typing, but every behavioral claim in
this submission is backed by a command I actually ran or a test that passes.
