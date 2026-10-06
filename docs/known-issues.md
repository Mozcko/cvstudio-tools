# Known Issues and Gotchas

What is still open after the `fix/known-issues` round. Each item says how sure the finding is:

- **Read** — follows directly from the code.
- **Ran** — reproduced by executing something.
- **Not exercised** — implemented and covered by build, lint, type-check and unit tests, but not
  clicked through in a browser (the app needs Clerk keys and a running backend to start).

Delete entries as they are resolved. The list of what the round fixed is at the bottom.

## Needs a manual pass

### 1. The reworked editor flows were not exercised in a browser — Not exercised
Per-CV drafts, theme persistence, the save/autosave rules, the guest → account promotion, the AI
flows against the new `/ai/rewrite` endpoint and the print-based download were verified by
type-check, unit tests and (for printing) by rendering every theme through headless Chromium —
not by using the app signed in. Walk through the checklist in
[development.md](./development.md#manual-test-checklist) before merging.

### 2. Download is the browser's print dialog — Read
"Download PDF" opens the print dialog on a clean document; the user chooses *Save as PDF*.
Consequences:
- one more click than before, and the wording depends on the browser;
- the suggested file name comes from the document title (`Name_CV`), which most but not all
  browsers honour;
- headers/footers (date, URL) appear if the user has them enabled in the print dialog;
- on mobile browsers the flow goes through the system share/print sheet.

### 3. Page count and page-break guides are estimates — Read
The preview is one continuous sheet. The page badge and dashed guides are computed from the
content height (`usePrintPreview.ts`); the print engine decides the real breaks (it honours
`break-inside: avoid`, which only the Harvard theme declares), so a guide can be off by a few lines.

## Build, CI and tests

### 4. CI does not match this repository — Read
`.github/workflows/ci.yml` triggers only on `main` (the GitHub default branch is `master`), runs
inside `cvstudio-tools/` and `cvstudio-tools-backend/` directories that do not exist in this repo,
and uses Node 20 while Astro 6 requires Node ≥ 22.12. It should also run `pnpm typecheck` and
`pnpm test`.

### 5. Playwright is not installed or configured — Read
`pnpm test:e2e` runs `playwright test`, but `@playwright/test` is not a dependency and there is no
`playwright.config.*`. Because of that, `tests/` is excluded from `tsconfig.json`; remove the
exclusion when Playwright is set up.

### 6. No component or hook tests — Read
Vitest covers pure utilities only (Markdown round trip, dates, draft storage). `useCVLogic` — the
most intricate code in the repo — has no automated test.

## Stale or unused

| Item | Status |
| :--- | :--- |
| Root `README.md` | Still describes v1 (Supabase, OpenAI key, Node 18, a `CONTRIBUTING.md` that does not exist). Use [development.md](./development.md) |
| Theme id `hardvard` | Typo, but stored with every CV — do not rename without a data migration |
| `master` vs `main` | Two long-lived branches that are merged into each other; pick one |

## Design limitations to keep in mind

- **Local drafts are per browser.** A dirty local draft wins over the server copy when a CV is
  opened, so the same CV edited offline on two devices resolves to "last device to save".
- **Code mode is all-or-nothing.** Markdown that the generator would not produce itself keeps the
  CV in code mode (the round-trip check refuses to convert lossy input). AI actions always work
  on the structured data, not on hand-written Markdown.
- **Two language settings** (site URL vs editor toggle) are still independent; the editor only
  *defaults* to the URL locale the first time. See [i18n.md](./i18n.md).
- **Hardcoded strings** remain in `Dashboard`, `GuestBanner`, `AIChoiceModal`, `CookieConsent`
  and `privacy.astro`; `<html lang>` is always `es`.
- **Browser dialogs** (`alert`, `confirm`) are still used for delete/reset confirmations and
  dashboard errors.
- **`personal.role`** is collected by the form but not printed in the CV document.

## Fixed in the `fix/known-issues` round

For reference when reading old notes or commits. Numbers are from the previous version of this page.

| # | Was | Now |
| :--- | :--- | :--- |
| 1 | `/privacy` required sign-in | Public; pages without a `/en`, `/pt` twin are not locale-redirected |
| 2 | Locale redirect dropped `?id=` | Query string preserved; dashboard and editor links carry the locale prefix |
| 3 | Signed-out visitor with `?id=` stuck on "Cargando..." | Editor opens the local draft and asks to sign in |
| 4 | Cover letter shown as `[object Object]` | `cover_letter` string is unwrapped |
| 5 | es/pt months broke code → form | Own month tables in `cvLocale.ts`; tested for 3 languages × 12 months |
| 6 | Failed saves retried every 3 s | No retry until the next edit; never for guests |
| 7 | Theme not saved with the CV | `theme` sent to and loaded from the backend |
| 8 | Default theme id and CSS disagreed | CSS is derived from the id |
| 9 | Undo lost the pre-burst state | Snapshot taken at the start of a burst |
| 10 | Custom sections mutated state | Immutable updates |
| 11 | `Astro.redirect()` without `return` | Returned |
| 12 | Project URL never rendered | Emitted as `[Link](url)` and parsed back |
| 15 | Compiled `.js` twins shadowed the sources | Deleted |
| — | PDFs were images | Printed by the browser: selectable text |
| — | One draft per browser | One draft per CV (`cv-draft:<id>`), plus `cv-draft:new` |
| — | `CVData` under-typed, casts everywhere | Fields typed; casts removed from the editor |
| — | AI action multiplexed through a free-text `context` | Structured `POST /ai/rewrite` |
| — | Free-plan limit showed a generic save error | Opens the upgrade prompt |
| — | Unused files and dependencies | `LoginCard`, `UpgradeModal`, `default.md`, `html2pdf.js`, `openai` removed |
