## What and why

<!-- What does this change, and what problem does it solve? Link the issue: Closes #123 -->

## How it was tested

<!-- Commands you ran, what you clicked through in the browser (and in which languages), anything you could not test -->

## Screenshots

<!-- For anything visible: before / after. Delete if not applicable. -->

## Checklist

- [ ] `pnpm check` passes locally (lint, type-check, unit tests, build)
- [ ] New behaviour has tests; a bug fix has a test that failed before the fix
- [ ] New visible text is in `src/i18n/locales.ts` for es, en and pt
- [ ] Changes to the Markdown generator have the matching parser change and round-trip test
- [ ] New pages are in `src/lib/routes.ts` if they must be public
- [ ] API changes match the backend and `docs/data-model.md`
- [ ] No secrets, tokens or personal data in code, tests, logs or this description

## Deployment notes

<!-- New environment variables, backend changes that must ship first, anything to do before or after deploying. "None" is a fine answer. -->
