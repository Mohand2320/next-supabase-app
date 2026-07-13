# AGENTS.md — DentiPro

## Stack
Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · Supabase · Zod v4 · Framer Motion 12

The app is a dental-clinic management system. All docs are in French.

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (flat config) |
| `npm run env:dev` | Switch to DEV Supabase |
| `npm run env:prod` | Switch to PROD Supabase |
| `npm run env:show` | Show active environment |
| `npm run build:clean` | `npm install --no-optional && npm run build` |

There is **no typecheck script** — run `npx tsc --noEmit` if type checking is needed.

## Environment switching
- `.env.development` / `.env.production` are the source files (committed).
- `npm run env:dev` copies `.env.development` to `.env.local` (gitignored).
- Always run `npm run env:dev` before `npm run dev` on a fresh clone.
- Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Supabase clients — three patterns
| File | When to use |
|---|---|
| `src/lib/supabase/client.ts` | Browser — `createBrowserClient()` for Client Components |
| `src/lib/supabase/server.ts` | Server — `createServerClient()` with cookies for Server Components, Route Handlers, Server Actions |
| `src/lib/supabase/admin.ts` | **Admin only** — `createClient()` with `SUPABASE_SERVICE_ROLE_KEY`. Bypasses RLS. Never import in client code. |

## Auth & middleware
- `src/middleware.ts` protects `/dashboard/*` and `/update-password`; redirects `/` and `/login` to `/dashboard` when logged in.
- Also checks `is_active` on `user_profiles` and signs out inactive users.
- API routes use `requireRoles(['admin', 'dentiste', 'assistant'])` from `src/lib/auth/guards.ts`.

## API routes structure
```
src/app/api/
  patients/           GET (list/search), POST (create)
    [id]/             GET, PUT, DELETE
      treatments/     GET, POST
  rdv/                GET (calendar), POST (create)
    [id]/             GET, PUT, DELETE (only if PLANIFIE)
      status/         PATCH (state machine: PLANIFIE→CONFIRME→TERMINE/ANNULE)
      convert-patient/ POST
  dentistes/          GET, POST
    [id]/             GET, PUT, DELETE
```
There is also a second API convention under `src/app/api/patients/` with `nom`/`prenom` DB columns vs `first_name`/`last_name` in the types. **Do not rename columns** — the mappers in `src/lib/mappers/patient.ts` handle the translation.

## Services layer
`src/services/` contains client-side service functions (plain `fetch` calls), not server logic. Server logic lives in API route handlers. Exception: `admin.service.ts` is a `'use server'` module using `supabaseAdmin` directly.

## Database schema
Numbered SQL files in `database/schema/` (01–10). Execute sequentially. Triggers auto-update `updated_at`. RLS in `08_rls_policies.sql`.

## Key architecture patterns
- `@/` path alias maps to `src/`
- Mappers convert between DB columns (snake_case French) and API types (camelCase English) — see `src/lib/mappers/`
- Zod schemas in `src/lib/validations/`
- Component directories under `src/components/` mirror feature modules (admin, agenda, patients, profile)
- No test framework is configured; no tests exist yet

## CI
Two GitHub Actions workflows:
- `backup.yml` — daily pg_dump stored as artifacts (30 day retention), requires `SUPABASE_DB_URL` secret
- `supabase-keepalive.yml` — runs Sun/Wed to prevent Supabase free-tier pausing
Both email-fail notifications via `MAIL_USER`/`MAIL_PASSWORD` secrets.

## Gotchas
- Middleware `config.matcher` explicitly **excludes** `/api` routes (line 81 of `src/middleware.ts`). API routes handle their own auth via `requireRoles`.
- The `build:clean` script uses `--no-optional` — do not run `npm ci` without checking for native deps.
- `admin.service.ts` uses `supabaseAdmin.auth.admin.listUsers({ perPage: 100 })` — change the page size if user count grows.
