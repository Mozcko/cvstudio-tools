# Development

## Prerequisites

- **Node ≥ 22.12** (hard requirement of Astro 6)
- **pnpm** (CI uses v9)
- A Clerk application (test keys are fine)
- The backend running somewhere — locally it is expected at `http://localhost:8000/api/v1`

## Setup

```bash
pnpm install
cp .env.example .env    # then fill in the values
pnpm dev                # http://localhost:4321
```

If `node_modules` predates the v2.0 upgrade (Astro 5, no `@clerk/astro`), run `pnpm install` again.

## Running the backend locally

The backend is a separate repository (`Mozcko/cvstudio-tools-backend`, FastAPI + PostgreSQL). The
local layout is one parent folder with the two repos side by side, each with its own git history
and remote:

```
cvstudio/
├── cvstudio-tools/            this repo (frontend)
└── cvstudio-tools-backend/    backend
```

```bash
# from the parent folder
git clone https://github.com/Mozcko/cvstudio-tools-backend.git
cp cvstudio-tools-backend/.env.example cvstudio-tools-backend/.env   # then fill in keys
```

Start it with Docker (API on `:8000`, Postgres on `:5432`, tables created on startup):

```bash
cd cvstudio-tools-backend && docker compose up --build
```

Then point the frontend at it with `PUBLIC_API_URL=http://localhost:8000/api/v1`. Swagger UI is at
`http://localhost:8000/docs`. To make a local user Pro:
`docker compose exec api python src/scripts/upgrade_user.py --email you@example.com`.

## Environment variables

| Variable | Used by | Notes |
| :--- | :--- | :--- |
| `PUBLIC_API_URL` | `src/lib/api.ts`, `PricingSection.tsx` | Backend base URL **including** `/api/v1`, no trailing slash |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk integration | `pk_test_…` / `pk_live_…` |
| `CLERK_SECRET_KEY` | Clerk middleware (server) | `sk_test_…` / `sk_live_…` |

`PUBLIC_`-prefixed variables are inlined into the client bundle; never put a secret behind that
prefix.

Production values for both services are in [`PROD-ENV-CHECKLIST.md`](../PROD-ENV-CHECKLIST.md).

## Scripts

| Command | Does |
| :--- | :--- |
| `pnpm dev` | Astro dev server with HMR |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Serve the build via Astro |
| `pnpm start` | `node dist/server/entry.mjs` — how production runs it |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm format` | Prettier over the repo |
| `pnpm typecheck` | `tsc --noEmit` over `src/` |
| `pnpm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `pnpm test:e2e` | `playwright test` — currently not runnable, see [known-issues.md](./known-issues.md) |

`astro build` does not type-check, so run `pnpm typecheck` as well. Before pushing:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Unit tests cover pure utilities only: the Markdown generator/parser round trip in three languages,
date parsing, and local draft storage (including migration of the old keys).

## Code style

- **Prettier** (`.prettierrc`): semicolons, single quotes, 2 spaces, 100 columns, `es5` trailing
  commas, with the Astro and Tailwind plugins (Tailwind classes are auto-sorted).
- **ESLint** (`eslint.config.mjs`, flat config): `@eslint/js` + `typescript-eslint` recommended,
  `eslint-plugin-astro`, and for `.jsx/.tsx` the React, React Hooks and `jsx-a11y` recommended
  rules. `no-explicit-any`, unused vars (unless `_`-prefixed) and `exhaustive-deps` are warnings.
- **Pre-commit**: Husky runs `pnpm exec lint-staged`, which applies `eslint --fix` and
  `prettier --write` to staged `js/jsx/ts/tsx/astro` files.
- TypeScript extends `astro/tsconfigs/strict`.

Conventions visible in the code:

- Function components with default exports; a few small ones are named exports
  (`Input`, `SectionHeader`, `SocialsEditor`…).
- State is lifted into hooks and passed down as props. No context, no state library.
- Translations are passed as a `t` prop inside the editor.
- Icons are inline SVG (Heroicons paths); there is no icon package.
- Comments are mostly in Spanish.

## Git and CI

- Default branch on GitHub is `master`; a `main` branch also exists and the two are merged into
  each other. Feature branches follow `feat/<issue>-<slug>`, `fix/<slug>`, `chore/<slug>`.
- Dependabot: npm weekly (max 10 open PRs), GitHub Actions monthly.
- Issue templates: bug report and feature request; blank issues are disabled.
- `.github/workflows/ci.yml` runs `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` on
  Node 22 for pushes and pull requests to `main` and `master`.

## Deployment

Railway, two services (see `PROD-ENV-CHECKLIST.md`):

- **Frontend** (this repo): `pnpm build` then `pnpm start`. The Node adapter in `standalone` mode
  serves both SSR and static assets; it honours `HOST` and `PORT`.
- **Backend** (`cvstudio-tools-backend`): PostgreSQL, Clerk secret, Stripe keys + webhook secret +
  three price ids, the Clerk issuer and webhook secret, the OpenAI key, `FRONTEND_URL` for CORS.

Post-deploy smoke test, from the checklist: landing loads, backend `/api/v1/health` is healthy,
login works, an AI feature shows the upgrade modal for a free user, a pricing button opens Stripe
Checkout.

## Recipes

### Add a field to the CV

1. `src/types/cv.ts` — the interface and `initialCVData`.
2. `CVForm` (or the relevant item component) — the input.
3. `markdownGenerator.ts` — output it.
4. `markdownParser.ts` — parse it back, otherwise code → form switching breaks for every CV that
   uses the field.
5. `useCVLogic.ts` — the `cvData` normaliser (default value) and the AI merge in `handleAiAction`.
6. `Dashboard.tsx` `ResumeCard` `safeData`, if the generator would crash without it.
7. Extend `src/utils/__tests__/markdownRoundTrip.test.ts` so the field is covered.

### Add a new CV section

Everything above, plus: a new slot id in the default `sectionOrder` (`DEFAULT_SECTION_ORDER` in
`src/types/cv.ts`), a branch in `CVForm`'s section
renderer and `getSectionTitle`, a `sections.*` translation, and `titlesMap` in `src/utils/cvLocale.ts`.

### Add a public page

Create the `.astro` file (and its `[lang]/` twin if it should be localised), then add the path to
`isPublicRoute` in `src/middleware.ts`. If it has no `[lang]` twin, also add it to
`UNLOCALIZED_PATHS` there so the locale middleware does not redirect to a non-existent URL.

### Add a backend call

Add a method to the `api` object in `src/lib/api.ts`, typed with `apiRequest<T>`. Call it with
`await getToken()` from `useAuth()`. Do not `fetch` the backend directly from components.

### Add a theme / a translation

See [markdown-pdf-themes.md](./markdown-pdf-themes.md#adding-a-theme) and
[i18n.md](./i18n.md#adding-a-string).

## Manual test checklist

Needs Clerk keys in `.env` and the backend running (see above). Use a private window for the
guest steps.

1. **Guest:** open `/app/editor`, edit, reload — the edit is still there. *Save* and *Download*
   open the sign-in prompt.
2. **Promotion:** sign in from there and land on the dashboard — the draft appears as a CV.
3. **Per-CV state:** create two CVs with different themes and content. Each reopens with its own
   data and theme, and the dashboard thumbnails differ.
4. **Locale:** set the browser language to English, open a CV from the dashboard — it loads the
   right CV under `/en/app/editor?id=…`.
5. **Autosave:** edit a saved CV, wait 3 s — "saved". Stop the backend, edit — one error toast and
   no repeats; start it, edit again — it saves.
6. **Undo:** type a sentence quickly, press `Ctrl+Z` once — the whole sentence goes.
7. **Code mode:** in Spanish and Portuguese, with dates in April, August and December, switch to
   Markdown and back — it returns to the form. Break the Markdown — it refuses and stays.
8. **Download:** *Download PDF* → *Save as PDF*; select text in the file. Repeat for each theme.
9. **Limits:** as a free user, try a fourth CV from the dashboard and from the editor — upgrade
   prompt both times.
10. **AI (Pro):** enhance, optimize, translate, cover letter and ATS; as a free user each opens the
    upgrade prompt.
11. `/privacy` loads signed out; `/login` redirects to sign-in.
