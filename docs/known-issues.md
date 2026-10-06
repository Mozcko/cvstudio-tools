# Known Issues and Gotchas

Found while reading the code to write this knowledge base (commit `a1c75dc`). Nothing here has been
fixed. Each item says how sure the finding is:

- **Read** — follows directly from the code.
- **Ran** — reproduced by executing something.
- **Likely** — follows from the code but depends on runtime behaviour that was not exercised
  (the app was not run; the backend is in another repo).

Delete entries as they are resolved.

## Bugs

### 1. `/privacy` is not a public route — Read
`isPublicRoute` in `src/middleware.ts:4` does not list `/privacy`, so signed-out visitors are sent
to sign-in. The cookie banner links to that page and `tests/privacy.spec.ts` expects to read it
anonymously. In addition, a visitor whose preferred locale is `en`/`pt` would be redirected to
`/en/privacy`, which has no page.

### 2. Locale redirect drops the query string — Read / Likely impact
`src/middleware.ts:59` builds the redirect target from `pathname` only. Dashboard cards link to the
un-prefixed `/app/editor?id=<uuid>`, so for any user whose cookie or browser prefers `en`/`pt` the
redirect lands on `/en/app/editor` **without `id`**, and the editor opens the `localStorage` draft
instead of the chosen CV. The same applies to the `?id=` URL written after a save. Fix: append
`url.search`, and/or build prefixed links in `Dashboard`.

### 3. Signed-out visitor with `?id=` is stuck on "Cargando..." — Read
`isInitializing` starts `true` whenever the URL has `id` (`useCVLogic.ts:92`), but `initData`
returns before its `try/finally` when there is no user (`useCVLogic.ts:169`), so the flag is never
cleared and `CVBuilder` never renders.

### 4. Cover letter result is an object, not a string — Read (both repos)
The backend returns `{ "cover_letter": "…" }` (`routers/ai.py`), `api.generateCoverLetter` is typed
accordingly, and `handleGenerateCoverLetter` returns that object as is (`useCVLogic.ts:623`).
`CoverLetterModal` expects `string | null` and puts the value straight into a textarea and into
`result.replace(...)`, so the modal shows `[object Object]` and PDF download throws.
Fix: return `res.cover_letter`.

### 5. Code → form fails for some months in Spanish and Portuguese — Ran
The parser tries `new Date("<month> <year>")` before its own month table
(`markdownParser.ts:113`). V8 accepts unknown month words and silently yields January, so the
table is never consulted. Checked in Node 22 against the generator's `Intl` output:

| Language | Months that come back as January |
| :--- | :--- |
| en | none |
| es | `abr`, `ago`, `dic` |
| pt | `fev.`, `abr.`, `mai.`, `ago.`, `set.`, `out.`, `dez.` (format is `jan. de 2023`) |

No data is corrupted — the round-trip check in `handleSetEditMode` notices the mismatch and refuses
to leave code mode — but a CV with such a date cannot return to the visual editor. Fix: consult the
month table first, and handle the `de` in Portuguese.

### 6. Save failures retry every 3 seconds — Read
On error `saveStatus` becomes `'error'` while `isDirty` stays `true`, which re-arms the autosave
effect (`CVBuilder.tsx:116`). While the backend is unreachable the user gets an error toast every
~3 s. Similarly, a signed-out browser that still has a `cv-resume-id` re-opens the auth modal 3 s
after each edit.

### 7. Theme is not saved with the CV — Read
`createCV` / `updateCV` never send `theme`; the selection lives only in `localStorage` and is
shared by every CV opened in that browser. The backend has no `theme` column or field at all, so
`cv.theme` is always `undefined` and dashboard thumbnails always use the first theme (Harvard
classic), whatever the editor shows. Fixing this needs a backend column, migration and schema field.

### 8. Default theme id and CSS disagree — Read
`cv-theme-id` defaults to `'basic'` but `cv-custom-css` defaults to `themes[0].css`, which is
Harvard classic (`useCVLogic.ts:87-88`). A first-time visitor sees "Basic" selected while the
preview uses the Harvard stylesheet.

### 9. Undo restores the wrong snapshot after fast typing — Read
`handleDataChange` re-captures `previousState` on every call and restarts the 800 ms timer
(`useCVLogic.ts:231`). After a burst of edits the snapshot pushed is the state before the **last**
keystroke, not before the burst, so the first undo steps back one character and the pre-burst state
is lost.

### 10. Custom sections mutate state in place — Read
`CustomSectionsEditor.addItem` / `updateItem` copy the outer array but then `push` to / assign into
the existing `items` array. Those arrays are shared with undo snapshots, which can therefore change
after the fact.

### 11. `Astro.redirect()` without `return` — Read
`src/pages/login.astro` and `src/pages/app/dashboard.astro` call `Astro.redirect(...)` without
returning it, so nothing happens. The dashboard is still protected by the middleware; `/login`
renders an empty page for signed-in users.

### 12. Project URL is never rendered — Read
The generator prints the literal `| Link` when a project has a URL
(`markdownGenerator.ts`); the parser then restores `url` as the placeholder string `'link'`. The
address is lost on a code → form round trip. `addProject` also omits `url` from new projects.

## Build, CI and tests

### 13. CI does not match this repository — Read
`.github/workflows/ci.yml`:
- triggers only on `main`, while the GitHub default branch is `master`;
- runs every step inside `cvstudio-tools/` and `cvstudio-tools-backend/`, directories that do not
  exist here (it appears to have been written for a monorepo);
- uses Node 20, but Astro 6 requires Node ≥ 22.12.

### 14. Playwright is not installed or configured — Read
`pnpm test:e2e` runs `playwright test`, but `@playwright/test` is not in `package.json` and there is
no `playwright.config.*` (the spec calls `page.goto('/')`, which needs a `baseURL`).

### 15. Compiled `.js` twins shadow the TypeScript sources — Likely
`src/utils/markdownParser.js` and `src/types/cv.js` sit next to their `.ts` originals, and every
import is extensionless. Vite's default resolution order tries `.js` before `.ts`, so the bundle is
expected to use the `.js` files. They are in sync today; an edit to only the `.ts` would silently
have no effect. `testParser.js` at the repo root is a leftover scratch script. Recommended: delete
all three.

## Stale or unused

| Item | Status |
| :--- | :--- |
| Root `README.md` | Describes v1 (Supabase, OpenAI key, Node 18, a `CONTRIBUTING.md` that does not exist). Setup steps there no longer work |
| `.env.example` Stripe variables | Not read by any code |
| `openai` dependency | Not imported since AI moved to the backend |
| `src/components/auth/LoginCard.tsx` | Not imported |
| `src/components/ui/UpgradeModal.tsx` | Not imported; duplicates `PricingSection`'s checkout call |
| `src/templates/default.md` | Not imported |
| `EditorToolbar` prop `onDashboardClick` | Never passed |
| `api.createCheckoutSession` | Only used by the unused `UpgradeModal`; `PricingSection` uses raw `fetch` |
| `ui.hero.badge`, `ai.dropdown.poweredBy` | Still say "DeepSeek" |
| Theme id `hardvard` | Typo, but persisted — do not rename without a migration |
| Print CSS in `Layout.astro` and `global.css` | Duplicated; left over from when PDFs were made with `window.print()` |

## Design limitations to keep in mind

- **PDFs are images.** html2pdf rasterises each page, so text in the downloaded CV cannot be
  selected or parsed. For a product that sells ATS optimisation this matters: real ATS parsers get
  no text from the file.
- **One draft per browser.** `cv-data` and `cv-resume-id` are global keys, not per-CV. Opening
  `/app/editor` without `?id=` continues the last CV; there is no "new blank CV" path from the
  editor itself, and **Reset** keeps `resumeId`, so the next autosave overwrites that cloud CV with
  the sample data.
- **The 3-CV free limit is checked client-side only in `Dashboard.handleCreate`.** The backend does
  enforce it (`403` on create), but the editor's first save shows that as a generic "Error saving"
  toast and then retries every 3 s (item 6), with no hint that the limit is the cause.
- **A non-Pro AI call returns `500`, not `403`** (backend bug), and an expired pass still reports
  `is_pro: true` from `/users/me` for a while. The UI can therefore show Pro features that then
  fail with a generic error. See `../cvstudio-tools-backend/docs/known-issues.md`.
- **AI actions are multiplexed through free text.** Action, language and job description travel in
  one `context` string to `/ai/improve`; the pasted job description is user-controlled text inside
  that string.
- **Two languages settings** (site vs editor) are not linked — see [i18n.md](./i18n.md).
- **`CVData` is under-typed.** `projects`, `customSections`, `sectionOrder` and `language` are
  accessed through casts in a dozen places; adding them to the interface would remove most
  `as unknown as` in the editor.
- **Browser dialogs** (`alert`, `confirm`) are still used for delete/reset confirmations, the PDF
  sign-in prompt and dashboard errors, alongside the newer `Toast`.
