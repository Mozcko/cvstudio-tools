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
  The backend verifies the token against Clerk; this frontend holds no secrets beyond Clerk's.

## Three kinds of user

| Capability | Guest | Free (signed in) | Pro |
| :--- | :---: | :---: | :---: |
| Use the editor, themes, live preview | ✅ | ✅ | ✅ |
| Local draft in `localStorage` | ✅ | ✅ | ✅ |
| Save to cloud / autosave / dashboard | ❌ sign-in prompt | ✅ | ✅ |
| Download PDF | ❌ sign-in prompt | ✅ | ✅ |
| Number of CVs | — | 3 | unlimited |
| AI: enhance, optimize, translate | ❌ sign-in prompt | ❌ upgrade prompt | ✅ |
| ATS simulator, cover letter | ❌ sign-in prompt | ❌ upgrade prompt | ✅ |

`isGuest` is "Clerk has loaded and there is no user". `isPro` comes from `GET /users/me` → `is_pro`,
fetched in two places: `useCVLogic` (editor) and the `useProStatus` hook (header, dashboard,
pricing).

The client checks are there for a good experience; the backend is the authority. It enforces the
CV limit (`403` on `POST /cvs/`), Pro on every `/ai/*` endpoint (`403`) and an AI rate limit
(`429`), and the editor maps those answers to the right prompt even when its own idea of the plan
is stale (for example a pass that expired while the tab was open). PDF download is purely
client-side and cannot be enforced.

### Guest mode and promotion

`/app/editor` is a public route so visitors can try the product. `GuestBanner` tells them their
work is local only; it lives in the `cv-draft:new` local draft. When they sign in, one of two
things happens:

- **They land on a page other than the editor** (usually the dashboard). `GuestSync`
  (`src/components/auth/GuestSync.tsx`, mounted by `AppLayout`) finds a dirty `new` draft that is
  not the untouched sample, creates a cloud CV from it, re-keys the draft to the new id and fires
  `cvstudio:cv-created` so the dashboard reloads its list.
- **They land back in the editor.** The draft is already on screen; the banner disappears and
  **Save** creates the CV. `GuestSync` stays out of the way there to avoid a duplicate.

If the create fails (typically the free-plan limit), the local draft is kept.

### `AuthRequiredModal`

One modal with two modes, opened through `triggerAuthModal(title?, description?, mode)`:

- `auth` → button to `{locale}/sign-in`
- `upgrade` → button to `{locale}/pricing`

Default texts come from `t.messages.*`; callers pass specific ones ("sign in to download",
"free plan limit", …).

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
2. `api.createCheckoutSession(plan_type)` → `{ url }`.
3. `window.location.href = url` (Stripe-hosted checkout).
4. Stripe notifies the backend by webhook (`/api/v1/webhooks/stripe`); the backend grants Pro,
   adding the purchased time to whatever the user has left. The frontend only ever learns the
   result by re-reading `/users/me`.

`PricingSection` appears on the landing page (`#pricing`) and on the standalone `/pricing` page.
On the standalone page it also has a promo-code field (revealed by clicking the title five times)
that calls `api.redeemPromo`; a code can be redeemed once per account.

## AI features

All entry points are in the `AITools` dropdown (each shows a `PRO` chip for non-Pro users). All go
through `useCVLogic`: `canUseAi()` checks guest → Pro first, and `reportAiError()` turns backend
answers into the sign-in prompt, the upgrade prompt, a "limit reached" toast or a generic error.

| Menu item | Flow | Endpoint |
| :--- | :--- | :--- |
| Enhance writing | `handleAiAction('enhance')` | `POST /ai/rewrite` |
| Optimize for job post | `OptimizeModal` (paste JD) → `handleAiAction('optimize', jd)` | `POST /ai/rewrite` |
| Translate | `handleAiAction('translate')` | `POST /ai/rewrite` |
| Cover letter | `CoverLetterModal` → `handleGenerateCoverLetter(jd)` | `POST /ai/cover-letter` |
| ATS simulator | `ATSModal` → `handleAtsAnalysis(jd)` | `POST /ai/ats` |

Every request includes the editor language, so results come back in the language the user is
working in.

### The three "rewrite" actions

```ts
api.rewriteCV({ cv_content: cvData, action, target_language: lang, job_description }, token)
// → { cv: { …a whole CV… } }
```

The hook then:

1. Requires a `personal` object in the answer.
2. **Merges defensively** over the current data: each scalar and each list is taken from the AI
   result only if present and non-empty, otherwise the user's existing value is kept. An AI
   response that drops a section cannot erase it. `sectionOrder` is always the user's.
3. Stores the merged CV as `pendingAiData` and opens **`AIChoiceModal`**:
   - **Update current** → push an undo snapshot, replace the data, mark dirty.
   - **Create a copy** → save the current CV if dirty, `POST` a new CV titled `"<title> (AI)"`, and
     switch the editor to it. If the free-plan limit blocks the copy, the upgrade prompt opens.

For `translate`, the target language is the editor's current language, and the CV's `language`
field is updated to match.

While a request is running, `isAiProcessing` shows a spinner in the AI button and a blocking overlay
on the editor panel.

### ATS simulator and cover letter

Both modals have two states — paste a job description, then view the result — and keep their result
in local component state (closing and reopening keeps it; "analyze another" clears it).

- `ATSModal` renders score cards (colour thresholds at 80 and 60), the requirement-by-requirement
  analysis, missing keywords and improvement actions.
- `CoverLetterModal` shows the letter in an editable textarea with **Copy** and **Download PDF**
  (the same `printHtml` helper the CV uses).

Prompts, model choice, PII masking and rate limits are backend concerns, documented in
`../cvstudio-tools-backend/docs/ai-services.md`. In short: every feature runs on OpenAI, and
contact details are masked before any CV is sent to the model.
