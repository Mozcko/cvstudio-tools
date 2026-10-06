# Data Model

## `CVData` (`src/types/cv.ts`)

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
  projects?: Project[];              // { id, name, role, startDate, endDate, url, description: string[] }
  customSections?: CustomSection[];  // { id, title, items: { id, title, subtitle, description }[] }
  sectionOrder?: string[];           // order of: experience, projects, education, skills, custom
  language?: string;                 // 'ES' | 'EN' | 'PT'
}
```

Dates are `YYYY-MM` strings (from `<input type="month">`). `endDate` is `null` when `isCurrent`
(projects use `''` instead of `null`).

Also exported from the same file: `Project`, `CustomSection`, `CustomItem`, `CVLang`
(`'es' | 'en' | 'pt'`), `DEFAULT_SECTION_ORDER`, and `initialCVData` — the "John Doe" sample shown
to a brand-new visitor and restored by **Reset**.

`sectionOrder` covers five slots, not seven: the `skills` slot renders skills **and**
certifications, languages and interests together.

### Normalisation

The four optional fields may be missing in stored data. `useCVLogic` never hands raw data to the
UI: its `cvData` memo fills in a default `personal`, coerces every list to an array, lower-cases
`sectionOrder` and appends any missing default slots. Read `cvData`, not `rawData`.

## Markdown-mode content

When a CV is saved while the editor is in code mode, `content` is **not** a `CVData`:

```ts
interface MarkdownCVContent { mode: 'markdown'; markdown: string }
type CVContent = CVData | MarkdownCVContent;
```

Use the `isMarkdownContent(content)` type guard before treating content as `CVData`. Today that is
the editor loader (`useCVLogic.ts`) and the dashboard thumbnail (`Dashboard.tsx`).

## Backend API contract (`src/lib/api.ts`)

All requests go to `${PUBLIC_API_URL}${endpoint}` with `Authorization: Bearer <Clerk token>`.
Non-2xx responses throw an `ApiError` (`message` = the response's `detail`, numeric `status`,
optional `retryAfter`). Check with `isApiError(error, 403)`. GETs append `?_t=<timestamp>` to
defeat caching.

| Client method | HTTP | Request body | Response |
| :--- | :--- | :--- | :--- |
| `getUserProfile` | `GET /users/me` | — | `{ id, is_pro, pro_expires_at }` |
| `getCVs` | `GET /cvs/` | — | `CVRecord[]`, newest first |
| `getCV(id)` | `GET /cvs/{id}` | — | `CVRecord` |
| `createCV` | `POST /cvs/` | `{ title, content, language?, theme? }` | `CVRecord` |
| `updateCV(id)` | `PUT /cvs/{id}` | any of `{ title, content, language, theme }` | `CVRecord` |
| `deleteCV(id)` | `DELETE /cvs/{id}` | — | 204 |
| `rewriteCV` | `POST /ai/rewrite` | `{ cv_content, action, target_language, job_description? }` | `{ cv }` |
| `simulateATS` | `POST /ai/ats` | `{ cv_content, job_description, language }` | `ATSResult` |
| `generateCoverLetter` | `POST /ai/cover-letter` | `{ cv_content, job_description, language }` | `{ cover_letter }` |
| `createCheckoutSession` | `POST /billing/create-checkout-session` | `{ plan_type: '7' \| '30' \| 'lifetime' }` | `{ url }` |
| `redeemPromo` | `POST /promo/redeem` | `{ code }` | `{ success, message, granted_days }` |

`CVRecord` is `{ id, title, content: CVContent, language, theme: string | null, updated_at }`.

Things worth knowing:

- **The server assigns CV ids.** Use the `id` of the returned record.
- **Statuses the UI reacts to:** `403` on `POST /cvs/` = free-plan limit; `403` on an `/ai/*` call =
  not Pro; `429` on an `/ai/*` call = rate limit; `404` / `403` on a CV id = not found / not yours.
- `action` is `'enhance' | 'optimize' | 'translate'`; `job_description` is required for `optimize`.
- `ATSResult`: `final_ats_score`, `overall_interview_probability`, `tier_classification`,
  `hard_requirements_analysis[] { requirement, status: match|missing|partial, comment }`,
  `missing_keywords[]`, `top_improvement_actions[]`.

The backend itself (database schema, plan expiry, AI prompts, Stripe webhooks) is documented in
the sibling repository: `../cvstudio-tools-backend/docs/`, starting with `api-reference.md`.

## Browser storage

### `localStorage`

| Key | Type | Owner | Purpose |
| :--- | :--- | :--- | :--- |
| `cv-draft:<id>` | `CVDraft` JSON | `src/lib/cvDraft.ts` | Working copy of one saved CV |
| `cv-draft:new` | `CVDraft` JSON | `src/lib/cvDraft.ts` | The unsaved draft (guests, or before the first save) |
| `app-lang` | `es` \| `en` \| `pt` | `useTranslation` | Editor UI language (defaults to the URL locale) |
| `hide-pro-banner` | `'true'` | `Dashboard` | Dismissed "Pro Account" banner |
| `cvstudio_consent` | `'true'` | `CookieConsent` | Cookie banner accepted |

`CVDraft` is `{ data: CVData, themeId, title, mode: 'form' | 'code', markdown, dirty, updatedAt }`.
`dirty` means "has changes the server does not have"; a dirty draft wins over the server copy when
the CV is opened. Drafts are removed when a CV is deleted from the dashboard and moved when a new
CV receives its id. See [editor.md](./editor.md#local-drafts-srclibcvdraftts).

The legacy keys `cv-data`, `cv-resume-id`, `cv-theme-id` and `cv-custom-css` are migrated once by
`migrateLegacyDraft` and then deleted.

`useLocalStorage` (`src/hooks/useLocalStorage.ts`) is a `useState`-compatible hook that JSON-encodes
values; it is now only used for `app-lang`.

### Cookies

| Cookie | Set by | Read by |
| :--- | :--- | :--- |
| `cvstudio_locale` | `LanguagePicker` (1 year) | `src/middleware.ts` locale redirect |
| Clerk session cookies | Clerk | Clerk middleware |

### Window events

| Event | Fired by | Handled by |
| :--- | :--- | :--- |
| `cvstudio:cv-created` | `GuestSync`, after promoting a guest draft | `Dashboard` reloads its list |
