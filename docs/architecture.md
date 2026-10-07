# Architecture

## Stack

| Concern | Choice | Notes |
| :--- | :--- | :--- |
| Framework | Astro 6, `output: 'server'` | SSR on every request, `@astrojs/node` adapter in `standalone` mode |
| UI | React 19 islands | Almost every island is `client:only="react"` (no SSR of React) |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` | Design tokens in `src/styles/global.css` (`@theme`) |
| Auth | Clerk (`@clerk/astro`) | Middleware + React hooks/components |
| Data / AI / billing | External REST backend | Base URL in `PUBLIC_API_URL`; see [data-model.md](./data-model.md) |
| Markdown → HTML | `react-markdown` + `rehype-raw` | Raw HTML is allowed (the CV uses `<table>` and `<br>`) |
| HTML → PDF | The browser's print engine, via a hidden iframe | `src/utils/printDocument.ts`; real text, no library |
| Unit tests | Vitest | Pure utilities only |
| Code editor | `react-simple-code-editor` + Prism | Markdown mode |
| Runtime | Node ≥ 22.12 (required by Astro 6), pnpm | |

AI calls are made by the backend; this app has no AI SDK.

## System context

```
 Browser ──────────────── HTML/JS ─────────────── Astro server (this repo, Node standalone)
    │                                               └─ middleware: Clerk auth + locale redirect
    │
    ├── Clerk (hosted) ........ sign-in/up UI, session, getToken()
    │
    └── Backend API (PUBLIC_API_URL, e.g. https://api…/api/v1)   ← separate repo
            ├─ /users/me            profile + is_pro
            ├─ /cvs/…               CV CRUD (PostgreSQL)
            ├─ /ai/…                OpenAI (gpt-4o-mini)
            └─ /billing/…           Stripe checkout + webhooks
```

The Astro server never talks to the backend itself. All API calls are made **from the browser**
with `Authorization: Bearer <Clerk token>`. There are no `src/pages/api/*` routes any more.

## Directory map

```
src/
├── middleware.ts            Clerk route protection + locale redirect
├── layouts/
│   ├── Layout.astro         <html>, global CSS, CookieConsent
│   ├── AppLayout.astro      Layout + GuestSync, full-height app shell
│   └── PublicLayout.astro   Layout + SiteHeader + footer
├── pages/
│   ├── index.astro          Landing (es)             ├── [lang]/index.astro        Landing (en, pt)
│   ├── pricing.astro                                 ├── [lang]/pricing.astro
│   ├── sign-in.astro, sign-up.astro                  ├── [lang]/sign-in.astro, sign-up.astro
│   ├── app/dashboard.astro, app/editor.astro         └── [lang]/app/dashboard.astro, editor.astro
│   ├── privacy.astro        Privacy policy           ├── [lang]/privacy.astro
│   └── login.astro          Legacy redirect to /sign-in
├── components/
│   ├── auth/                GuestSync, UserMenu
│   ├── dashboard/           Dashboard (+ ResumeCard)
│   ├── editor/              Toolbar, AI menu, modals, theme picker
│   │   ├── CVBuilder/       Editor root, its two hooks, the two panels
│   │   └── CVForm/          The structured form and its sub-editors
│   └── ui/                  SiteHeader, HeroActions, Features/PricingSection, LanguagePicker,
│                            CookieConsent, Toast
├── hooks/                   useLocalStorage, useTranslation, useProStatus, useFitScale
├── i18n/                    locales.ts (all strings), utils.ts (server-side helper)
├── lib/                     api.ts (typed backend client), cvDraft.ts (per-CV local drafts)
├── templates/               CV themes (CSS) + registry (index.ts)
├── types/cv.ts              CVData types + initialCVData sample
├── utils/                   markdownGenerator.ts, markdownParser.ts, cvLocale.ts, printDocument.ts
└── styles/global.css        Tailwind import, theme tokens, print rules, scrollbar

tests/privacy.spec.ts        Playwright e2e (see development.md for its status)
.agents/skills/              Vendored Clerk agent skills (tooling, not app code); skills-lock.json
PROD-ENV-CHECKLIST.md        Railway deployment variables for frontend and backend
```

## Routes

Spanish is the default locale and has no URL prefix; English and Portuguese live under `/en` and
`/pt` via the `[lang]` folder.

| Route (es) | Prefixed twin | Access | Renders |
| :--- | :--- | :--- | :--- |
| `/` | `/[lang]/` | public | Landing: hero, `FeaturesSection`, `PricingSection` |
| `/pricing` | `/[lang]/pricing` | public | `PricingSection` |
| `/sign-in`, `/sign-up` | `/[lang]/sign-in`, `/[lang]/sign-up` | public | Clerk `<SignIn>` / `<SignUp>` |
| `/app/editor` | `/[lang]/app/editor` | **public** (guest mode) | `CVBuilder` |
| `/app/dashboard` | `/[lang]/app/dashboard` | signed-in | `Dashboard` |
| `/privacy` | `/[lang]/privacy` | public | Static policy (`PrivacyPolicy.astro`) |
| `/login` | — | public | Redirects to `/sign-in` |

The editor takes one query parameter: `/app/editor?id=<cv uuid>` loads that CV from the backend.
Without `id` it works on whatever is in `localStorage`.

## Middleware (`src/middleware.ts`)

Two middlewares run in sequence on every request:

1. **Clerk** — if there is no `userId` and the path is not in the `isPublicRoute` list
   (`src/middleware.ts:4`), redirect to sign-in with a return URL. The public list is an explicit
   allow-list: a new public page must be added there (in all three locale forms) or it will bounce
   anonymous visitors.
2. **Locale redirect** — skipped for `/api`, `/_astro`, any path containing a `.`,
   `/sign-in` / `/sign-up`, and pages that have no `/en` or `/pt` twin (`UNLOCALIZED_PATHS`:
   `/login`). Otherwise it picks a preferred locale (cookie `cvstudio_locale` →
   browser `Accept-Language` → `es`) and, if the URL has no locale prefix but the preference is
   `en` or `pt`, issues a `302` to the prefixed path, keeping the query string.

## Rendering model

- `.astro` pages do very little: choose a layout, resolve `lang`, mount one or two React islands.
- Islands use `client:only="react"` because they depend on Clerk's client state and `localStorage`.
  The exception is `CookieConsent` (`client:load`).
- `CVBuilder` additionally guards with an `isMounted` flag and shows "Cargando..." until mounted
  and until `useCVLogic` finishes its initial load.

## Layout nesting

```
Layout.astro  (html/head, global.css, <slot/>, CookieConsent)
 ├─ PublicLayout.astro  → SiteHeader + padded content + footer   (landing, sign-in/up)
 └─ AppLayout.astro     → GuestSync + full-height scroll container (editor, dashboard, pricing)
```

`GuestSync` lives in `AppLayout` so that the first app page a newly signed-in user lands on
(other than the editor itself) promotes their guest draft to the cloud — see
[auth-billing-ai.md](./auth-billing-ai.md).

## Design tokens

Defined once in `src/styles/global.css` and usable as Tailwind colours (`bg-app-bg`,
`border-panel-border`, `text-text-muted`, `bg-accent`, …):

| Token | Value | Use |
| :--- | :--- | :--- |
| `app-bg` | `#0f172a` | Page background |
| `panel-bg` / `panel-border` | `#1e293b` / `#334155` | Editor panels |
| `text-main` / `text-muted` | `#f8fafc` / `#94a3b8` | Text |
| `accent` / `accent-hover` | `#3b82f6` / `#2563eb` | Primary actions |
| `danger` / `danger-bg` | `#ef4444` / `#450a0a` | Destructive actions |

The app UI is dark-only. CV themes are unrelated to these tokens (see
[markdown-pdf-themes.md](./markdown-pdf-themes.md)).
