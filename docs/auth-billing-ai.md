# Auth, Plans and AI

## Authentication (Clerk)

- Integration: `clerk()` in `astro.config.mjs`; keys `PUBLIC_CLERK_PUBLISHABLE_KEY` and
  `CLERK_SECRET_KEY`.
- Server side: `clerkMiddleware` in `src/middleware.ts` protects everything not on the public list.
  Pages can also read `Astro.locals.auth().userId` (the dashboard pages do).
- Client side: `useAuth()` from `@clerk/astro/react` gives `{ userId, isLoaded, getToken }`.
  `<Show when="signed-in|signed-out">` and `<UserButton>` are used in `UserMenu` and `HeroActions`.
- Sign-in / sign-up pages mount Clerk's prebuilt `<SignIn>` / `<SignUp>` with dark `appearance`
  overrides.
- Every backend call does `const token = await getToken()` and passes it to `src/lib/api.ts`.
  The backend validates the token; this frontend holds no secrets beyond Clerk's.

## Three kinds of user

| Capability | Guest | Free (signed in) | Pro |
| :--- | :---: | :---: | :---: |
| Use the editor, themes, live preview | ✅ | ✅ | ✅ |
| Draft kept in `localStorage` | ✅ | ✅ | ✅ |
| Save to cloud / autosave / dashboard | ❌ auth modal | ✅ | ✅ |
| Download PDF | ❌ `alert()` | ✅ | ✅ |
| Number of CVs | — | 3 (checked in `Dashboard.handleCreate`) | unlimited |
| AI: enhance, optimize, translate | ❌ auth modal | ❌ upgrade modal | ✅ |
| ATS simulator, cover letter | ❌ auth modal | ❌ upgrade modal | ✅ |

`isGuest` is simply `!userId`. `isPro` comes from `GET /users/me` → `is_pro`, fetched in two places:
`useCVLogic` (editor) and the `useProStatus` hook (header, dashboard, pricing).

All of this gating is UX only. The backend enforces two of these rules itself: the 3-CV limit
(`403` on `POST /cvs/`) and Pro on every `/ai/*` endpoint. PDF download is purely client-side and
cannot be enforced.

### Guest mode and promotion

`/app/editor` is a public route so visitors can try the product. `GuestBanner` tells them their
work is local only. When they later sign in, `GuestSync` (`src/components/auth/GuestSync.tsx`,
mounted by `AppLayout`) runs once:

1. Signed in, and no `cv-resume-id` in `localStorage`?
2. Is there a `cv-data` draft that differs from `initialCVData`?
3. If so, `POST /cvs/` with a new UUID, title = the role (or "Mi CV"), then store the returned id
   in `cv-resume-id`.

The draft thereby becomes the user's first cloud CV without any action on their part.

### `AuthRequiredModal`

One modal with two modes, opened through `triggerAuthModal(title?, description?, mode)`:

- `auth` → button to `/sign-in`
- `upgrade` → button to `{lang}/pricing`

## Plans and checkout

Plans are one-off passes, not subscriptions:

| `plan_type` | Name in UI | Backend price variable |
| :--- | :--- | :--- |
| `'7'` | Sprint Pass | `STRIPE_PRICE_7D` |
| `'30'` | Active Hunt (recommended) | `STRIPE_PRICE_30D` |
| `'lifetime'` | Lifetime Access | `STRIPE_PRICE_LIFETIME` |

Names, prices and feature bullets are translation strings under `ui.pricing.plans` in
`src/i18n/locales.ts` — changing a displayed price is a copy change here, while the charged amount
is defined by the Stripe price ids on the backend.

Checkout flow (`PricingSection.handleAction`):

1. Not signed in → go to sign-in. Already Pro → no-op (buttons read "Your current plan").
2. `POST /billing/create-checkout-session { plan_type }` → `{ url }`.
3. `window.location.href = url` (Stripe-hosted checkout).
4. Stripe notifies the backend by webhook (`/api/v1/webhooks/stripe` — `PROD-ENV-CHECKLIST.md` gives a different, wrong path); the
   backend flips `is_pro`.
   The frontend only ever learns the result by re-reading `/users/me`.

`PricingSection` appears on the landing page (`#pricing`) and on the standalone `/pricing` page.

## AI features

All entry points are in the `AITools` dropdown (each shows a `PRO` chip for non-Pro users). All go
through `useCVLogic` and are checked guest → Pro before any request.

| Menu item | Flow | Endpoint |
| :--- | :--- | :--- |
| Enhance writing | `handleAiAction('enhance')` | `POST /ai/improve` |
| Optimize for job post | `OptimizeModal` (paste JD) → `handleAiAction('optimize', jd)` | `POST /ai/improve` |
| Translate | `handleAiAction('translate')` | `POST /ai/improve` |
| Cover letter | `CoverLetterModal` → `handleGenerateCoverLetter(jd)` | `POST /ai/cover-letter` |
| ATS simulator | `ATSModal` → `handleAtsAnalysis(jd)` | `POST /ai/ats` |

### The three "rewrite" actions

They share one generic endpoint (`useCVLogic.ts:457`):

```ts
api.improveText(
  JSON.stringify(cvData),                                   // text
  `Action: ${action}, Lang: ${lang}, JD: ${providedJd || ''}`, // context
  token
)
```

`improved_text` must be a JSON string of a whole CV. The hook then:

1. `JSON.parse`s it and requires a `personal` key.
2. **Merges defensively** over the current data: each scalar and each list is taken from the AI
   result only if present and non-empty, otherwise the user's existing value is kept. An AI
   response that drops a section cannot erase it.
3. Stores the merged CV as `pendingAiData` and opens **`AIChoiceModal`**:
   - **Update current** → push an undo snapshot, replace the data, mark dirty.
   - **Create a copy** → save the current CV if dirty, `POST` a new CV titled
     `"<title> (AI Optimized)"`, and switch the editor to it.

For `translate`, the target language is the editor's current UI language (`lang`), and the CV's
`language` field is updated to match.

While a request is running, `isAiProcessing` shows a spinner in the AI button and a blocking overlay
on the editor panel.

### ATS simulator and cover letter

Both modals have two states — paste a job description, then view the result — and keep their result
in local component state (closing and reopening keeps it; "analyze another" clears it).

- `ATSModal` renders score cards (colour thresholds at 80 and 60), the requirement-by-requirement
  analysis, missing keywords and improvement actions.
- `CoverLetterModal` shows the letter in an editable textarea with **Copy** and **Download PDF**.
  Its PDF does not use html2pdf: it writes a small HTML document into a hidden iframe and calls
  `print()`, so the user saves via the browser's print dialog. The value handed to this modal is
  probably the wrong shape — see [known-issues.md](./known-issues.md) item 4.

Prompts, model choice and PII anonymisation are backend concerns, documented in
`../cvstudio-tools-backend/docs/ai-services.md`. In short: every feature runs on OpenAI
`gpt-4o-mini` (the UI still says "Powered by Deepseek"), contact details are masked for ATS and
cover letters but **not** for enhance / optimize / translate, and a non-Pro call comes back as
`500` rather than `403`.

A promo-code field on the pricing section exists on the frontend's `main` branch (commit
`af6aeed`, calling `POST /promo/redeem`) but has not been merged into `master`.
