# Data Model

## `CVData` (`src/types/cv.ts`)

The declared type:

```ts
interface CVData {
  personal: {
    name: string; role: string; email: string; phone: string; city: string;
    summary: string;                 // Markdown allowed (e.g. **bold**)
    socials: SocialLink[];           // { id, network, username, url }
  };
  experience: Experience[];          // { id, company, role, location, startDate, endDate, isCurrent, description: string[] }
  skills: SkillItem[];               // { id, category, items }  → "- **category:** items"
  education: Education[];            // { id, institution, degree, startDate, endDate, isCurrent }
  certifications: SkillItem[];       // same shape as skills
  languages: string;                 // free text
  interests: string;                 // free text
}
```

Dates are `YYYY-MM` strings (from `<input type="month">`). `endDate` is `null` when `isCurrent`.

`initialCVData` in the same file is the "John Doe" sample shown to a brand-new visitor and restored
by the **Reset** button.

### Fields that exist at runtime but not in the type

These are read and written all over the editor through `as unknown as` casts. Treat them as part of
the model:

| Field | Shape | Written by |
| :--- | :--- | :--- |
| `projects` | `{ id, name, role, startDate, endDate, url, description: string[] }[]` | `CVForm` |
| `customSections` | `{ id, title, items: { id, title, subtitle, description }[] }[]` | `CustomSectionsEditor` |
| `sectionOrder` | `string[]` — any order of `experience`, `projects`, `education`, `skills`, `custom` | `CVForm` reordering |
| `language` | `'ES' \| 'EN' \| 'PT'` (upper-case) | `useCVLogic` on load, AI apply, mode switch |

`Project` and `CustomSection` are declared separately in `markdownGenerator.ts`,
`markdownParser.ts`, `SectionItems.tsx` and `CustomSectionsEditor.tsx`. Adding a field means
touching each copy.

`sectionOrder` covers five slots, not seven: the `skills` slot renders skills **and**
certifications, languages and interests together.

### Normalisation

`useCVLogic` never hands raw stored data to the UI. Its `cvData` memo
(`useCVLogic.ts:108`) fills in a default `personal`, coerces every list to an array, lower-cases
`sectionOrder` and appends any missing default slots. Anything loaded from the API or
`localStorage` therefore tolerates missing keys.

## Markdown-mode payload

When a CV is saved while the editor is in code mode, `content` is **not** a `CVData`:

```json
{ "mode": "markdown", "markdown": "# Jane Doe\n\n…" }
```

Every reader must branch on `content.mode === 'markdown'` first. Today that is the editor loader
(`useCVLogic.ts:188`) and the dashboard thumbnail (`Dashboard.tsx`, `ResumeCard`).

## Backend API contract (`src/lib/api.ts`)

All requests go to `${PUBLIC_API_URL}${endpoint}` with `Authorization: Bearer <Clerk token>`.
Non-2xx responses throw an `Error` whose message is the response's `detail` field and which carries
a numeric `status` property (callers check `status === 404`). GETs append `?_t=<timestamp>` to
defeat caching.

| Client method | HTTP | Request body | Response |
| :--- | :--- | :--- | :--- |
| `getUserProfile` | `GET /users/me` | — | `{ id, is_pro }` |
| `getCVs` | `GET /cvs/` | — | `{ id, title, content, language, updated_at, theme }[]` |
| `getCV(id)` | `GET /cvs/{id}` | — | `{ id, title, content, language }` |
| `createCV` | `POST /cvs/` | `{ id, title, content, language? }` | `{ id }` |
| `updateCV(id)` | `PUT /cvs/{id}` | `{ title?, content?, language? }` | `{ id }` |
| `deleteCV(id)` | `DELETE /cvs/{id}` | — | 204 |
| `improveText` | `POST /ai/improve` | `{ text, context }` | `{ improved_text }` |
| `simulateATS` | `POST /ai/ats` | `{ cv_content, job_description }` | ATS result object (below) |
| `generateCoverLetter` | `POST /ai/cover-letter` | `{ cv_content, job_description }` | `{ cover_letter }` |
| `createCheckoutSession` | `POST /billing/create-checkout-session` | `{ plan_type: '7' \| '30' \| 'lifetime' }` | `{ url }` |

Things worth knowing:

- The client sends a `crypto.randomUUID()` as `id` in `createCV`, but **the backend ignores it**
  and assigns its own UUID. Always use the `id` from the response (the code does).
- The editor loader defensively parses `content` if it is a string; the backend always returns an
  object.
- **`theme` does not exist on the backend** — no column, no response field. `CVListItem.theme` is
  always `undefined` (see [known-issues.md](./known-issues.md)).
- `GET /users/me` actually returns the whole user row (`id`, `email`, `is_pro`, `pro_expires_at`,
  `created_at`, `updated_at`); only `is_pro` is used.
- Creating a fourth CV as a free user fails with `403`; another user's CV id gives `403`, not
  `404`.
- `improveText` is a generic endpoint used for three actions; the action is smuggled in the
  free-text `context` (see [auth-billing-ai.md](./auth-billing-ai.md)).

ATS result fields used by `ATSModal`: `final_ats_score`, `overall_interview_probability`,
`tier_classification`, `hard_requirements_analysis[] { requirement, status: match|missing|partial,
comment }`, `missing_keywords[]`, `top_improvement_actions[]`.

The backend itself (database schema, plan expiry, AI prompts, Stripe webhooks) is documented in
the sibling repository: `../cvstudio-tools-backend/docs/`, starting with `api-reference.md`.

## Browser storage

### `localStorage`

| Key | Type | Owner | Purpose |
| :--- | :--- | :--- | :--- |
| `cv-data` | `CVData` JSON | `useCVLogic` | The CV being edited. One draft per browser, not per CV |
| `cv-resume-id` | string \| `null` | `useCVLogic`, `GuestSync` | Backend id of that draft; decides create vs update on save |
| `cv-theme-id` | string | `useCVLogic` | Selected theme id (default `basic`) |
| `cv-custom-css` | string | `useCVLogic` | The full CSS text of the selected theme |
| `app-lang` | `es` \| `en` \| `pt` | `useTranslation` | Editor UI language |
| `hide-pro-banner` | `'true'` | `Dashboard` | Dismissed "Pro Account" banner |
| `cvstudio_consent` | `'true'` | `CookieConsent` | Cookie banner accepted |

`useLocalStorage` (`src/hooks/useLocalStorage.ts`) is a `useState`-compatible hook that JSON-encodes
values; that is why a literal `'null'` string can appear for `cv-resume-id` and why the code checks
`resumeId !== 'null'`.

### Cookies

| Cookie | Set by | Read by |
| :--- | :--- | :--- |
| `cvstudio_locale` | `LanguagePicker` (1 year) | `src/middleware.ts` locale redirect |
| Clerk session cookies | Clerk | Clerk middleware |
