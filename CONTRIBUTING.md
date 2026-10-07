# Contributing

Thanks for working on the CVStudio.tools frontend. This page is the practical guide: how to set up,
what a change needs before it can be merged, and how it reaches production. For how the code works,
read [`docs/`](./docs/README.md).

## Quick start

You need Node 22.12+ and pnpm.

```bash
pnpm install
cp .env.example .env     # PUBLIC_API_URL and the two Clerk keys (development instance)
pnpm dev                 # http://localhost:4321
pnpm check               # everything CI checks: lint, type-check, unit tests, build
```

To save CVs or use the dashboard locally you also need the backend running; see
[`cvstudio-tools-backend`](https://github.com/Mozcko/cvstudio-tools-backend) (`make up`).

## Workflow

1. **Branch from `main`.** Name it `feat/…`, `fix/…`, `chore/…` or `docs/…`, with an issue number
   when there is one: `fix/42-undo-after-reset`.
2. **Make the change, with tests.** See [What a change needs](#what-a-change-needs).
3. **Run `pnpm check`** until it is green, and look at the change in the browser.
4. **Open a pull request to `main`.** Fill in the template. CI runs automatically.
5. **Merge when CI is green.** `main` is protected: a pull request and a passing
   `✅ CI passed` check are required. Prefer *Squash and merge*.
6. **Deployment** starts on its own after the merge — see [Deployment](#deployment).

Keep pull requests small and about one thing.

### Commit messages

A short imperative summary, optionally prefixed with the area, and a body when the *why* is not
obvious:

```
editor: pause autosave after Reset

Reset restored the sample CV and autosave pushed it over the saved one.
```

Never put secrets, tokens or personal data in a commit message — this repository is public.

## What a change needs

| If you change… | You also need… |
| :--- | :--- |
| Any logic in `src/utils/` or `src/lib/` | A unit test (`*.test.ts` next to it, under `__tests__/`) |
| The Markdown generator | The matching parser change, and the round-trip test extended (`src/utils/__tests__/markdownRoundTrip.test.ts`) |
| Visible text | The string in `src/i18n/locales.ts` for **es, en and pt** — no inline literals |
| The CV data model (`src/types/cv.ts`) | Form, generator, parser, the `cvData` normaliser in `useCVLogic.ts`, and `docs/data-model.md` |
| A page | Its `[lang]/` twin if it should be localised; `src/lib/routes.ts` if it must be public (with a test case) |
| A backend call | A typed method in `src/lib/api.ts` — never `fetch` from a component |
| A theme | Every selector under `.cv-preview-content`; check the preview **and** a downloaded PDF |
| A dependency | Check `pnpm audit --prod` does not get worse |

### Checks

```bash
pnpm lint         # ESLint (React, hooks, accessibility)
pnpm typecheck    # astro sync + tsc
pnpm test         # Vitest
pnpm build        # production build
pnpm check        # all of the above
pnpm format       # Prettier
```

A pre-commit hook (Husky + lint-staged) lints and formats staged files.

### Testing in the browser

There are no automated browser tests yet, so for anything in the editor run through the relevant
part of the checklist in [`docs/development.md`](./docs/development.md#manual-test-checklist), in at
least two languages and at a narrow (mobile) width. Say what you tried in the pull request.

### Conventions

- State lives in hooks and is passed down as props; there is no global store.
- Read CV data through the normalised `cvData`, not `rawData`.
- Guests must always be able to use the editor without the backend.
- Never log CV content or tokens to the console.

## Continuous integration

Every pull request and every push to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

| Job | Fails when |
| :--- | :--- |
| 🧹 Lint | ESLint reports an error |
| 🔤 Type Check | `tsc` reports an error |
| 🧪 Unit Tests | a Vitest test fails |
| 🏗️ Build | the production build fails |
| ✅ CI passed | any of the above did not succeed — this is the check required to merge |
| 🔒 Dependency Audit | *informational*: lists known vulnerabilities in production dependencies |

[`security.yml`](.github/workflows/security.yml) adds CodeQL analysis on every pull request and
weekly. Dependabot opens update pull requests weekly.

## Deployment

Production runs on Railway. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) deploys
`main` after CI has passed:

```
merge to main ─▶ CI ─▶ Deploy: approval (production environment) ─▶ railway up ─▶ live smoke test
```

- The deploy job waits for approval from a reviewer of the `production` environment.
- Afterwards it checks that `/`, `/privacy` and `/app/editor` answer on the live site and fails if
  they do not within five minutes.
- **Manual deploy or rollback:** *Actions → Deploy → Run workflow* and enter the commit to deploy.
- A change that needs a backend change must be deployed **after** the backend.

### One-time setup (maintainers)

| Where | What |
| :--- | :--- |
| GitHub → Settings → Secrets and variables → Actions → *Secrets* | `RAILWAY_TOKEN` = a Railway **project token** for the production environment (the backend repo uses the same project) |
| … → *Variables* | `RAILWAY_SERVICE` = the frontend service's **service id** (not the project id); `SITE_URL` = `https://www.cvstudio.tools` |
| GitHub → Settings → Environments → `production` | Required reviewers |
| Railway → frontend service → Settings → Source | **Disable automatic deploys**, otherwise every commit is deployed twice |

Until `RAILWAY_TOKEN` and `RAILWAY_SERVICE` exist, the deploy workflow skips itself with a warning.
The variables the app itself needs are in `PROD-ENV-CHECKLIST.md`.

## Reporting bugs and security problems

- Bugs and ideas: open an issue with the matching template.
- Security problems: **never in a public issue.** Follow [`SECURITY.md`](./SECURITY.md).
