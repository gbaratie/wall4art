# AGENTS.md

## Cursor Cloud specific instructions

Wall4Art is a pnpm monorepo (see `README.md` for the full stack overview):

- `apps/api` — Fastify + Prisma + Better Auth API (port `3002`).
- `apps/web` — React + Vite SPA (port `5173`, dev server proxies `/api` → API on `3002`).
- `packages/shared` — Zod schemas / enums consumed by both apps (must be built before the API compiles).

Standard commands live in the root `package.json` and `README.md` (`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm db:migrate`, `pnpm db:seed`). Notes below are only the non-obvious caveats.

### Database
- The dev DB is a local PostgreSQL 16 + PostGIS cluster (installed at environment setup, not by the update script). Start it before any DB/API work with `sudo pg_ctlcluster 16 main start` (idempotent; ignore "already running").
- Role/DB `wall4art` / password `wall4art` / db `wall4art` match `.env.example`. The `DATABASE_URL` in `.env.example` works as-is against this local cluster.
- The `postgis` extension is created automatically by the Prisma migration, so plain `postgresql-16-postgis-3` is required (not vanilla Postgres).

### Environment variables
- Copy `.env.example` → `.env` at the repo root (the API loads it via `dotenv` from the monorepo root, and Vite reads it via `loadEnv` from `../..`). Set a real `BETTER_AUTH_SECRET`.
- Prisma CLI commands (`db:migrate`, `db:seed`, `db:studio`) do NOT auto-load the root `.env`; export it first: `export $(grep -v '^#' .env | xargs)`.

### Build gotcha
- `packages/shared` builds with `tsc` incremental output. A stale committed `tsconfig.tsbuildinfo` used to make `tsc` skip emitting `dist/*.js`, which then broke the API build with `Cannot find module '@wall4art/shared'`. `*.tsbuildinfo` is now gitignored; if you ever see that error, run `rm -rf packages/shared/dist packages/shared/tsconfig.tsbuildinfo && pnpm --filter @wall4art/shared build`.

### Running / testing
- `pnpm dev` runs shared (tsc watch) + API + web in parallel. Demo accounts (after `pnpm db:seed`): `marie@wall4art.local`, `lea@wall4art.local`, `maire@wall4art.local`, `tom@wall4art.local`, all password `password123`.
- Known pre-existing issues (not environment problems, do not "fix" as part of setup):
  - `pnpm lint` fails on one real error: `MayorValidationStatus` unused in `packages/shared/src/schemas.ts`.
  - Email/password **sign-up** via Better Auth returns `FAILED_TO_CREATE_USER`: the `user.additionalFields.roles` (`string[]`) in `apps/api/src/lib/auth.ts` collides with the `roles` relation in the Prisma schema. **Sign-in** with seeded accounts works fine, so use those for testing.
