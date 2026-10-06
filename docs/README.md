# CVStudio.tools — Knowledge Base

Reference documentation for the `cv-builder` repository (the frontend of **CVStudio.tools**).

> Describes the code as of the `fix/known-issues` branch (October 2026). If the code has moved
> on, trust the code and update the page.

## What this project is

A web app for building résumés. The user fills in a form (or writes Markdown directly), sees a live
A4 PDF preview, picks a visual theme, and downloads a PDF. Signed-in users store CVs in the cloud;
paying ("Pro") users get AI features: rewrite, job-targeted optimisation, translation, ATS
simulation and cover-letter generation.

This repository contains **only the frontend** (Astro + React). Data, AI and billing live in a
separate backend service (`cvstudio-tools-backend`) that this app calls over HTTP. That repo has
its own knowledge base at `../cvstudio-tools-backend/docs/`.

## Pages

| Page | Read it when you need to… |
| :--- | :--- |
| [architecture.md](./architecture.md) | Understand the stack, folder layout, routes, middleware and how the pieces talk |
| [editor.md](./editor.md) | Change anything in the CV editor: state, saving, undo/redo, form, modals |
| [data-model.md](./data-model.md) | Know the shape of a CV, the backend API contract, and what is kept in the browser |
| [markdown-pdf-themes.md](./markdown-pdf-themes.md) | Touch Markdown generation/parsing, the PDF pipeline, or add a theme |
| [auth-billing-ai.md](./auth-billing-ai.md) | Work on sign-in, guest mode, Pro gating, Stripe checkout or the AI tools |
| [i18n.md](./i18n.md) | Add or change translations, or debug locale redirects |
| [development.md](./development.md) | Set up locally, run lint/tests, deploy, or follow a how-to recipe |
| [known-issues.md](./known-issues.md) | See bugs, stale files and traps found while documenting — **read before a big change** |

## Thirty-second mental model

```
Form (CVData JSON) ──generateMarkdown──▶ Markdown ──react-markdown──▶ HTML sheet (+ theme CSS) = live preview
        ▲                                   │                                   │
        └────────parseMarkdownToCV──────────┘                           browser print engine
              (only when leaving code mode)                                     ▼
                                                                    PDF with real text (download)
```

- **Source of truth** is a `CVData` object, held in React state and mirrored to a per-CV draft in
  `localStorage`.
- **Markdown is derived** from it, unless the user switches to "code mode" and edits Markdown by hand.
- **The PDF is printed by the browser** from that same HTML (real, selectable text); nothing is
  rendered server-side.
- **Persistence** is the backend REST API, authenticated with a Clerk session token.

## Naming

The repo is `cv-builder`, the `package.json` name is `cv-builder`, the GitHub remote is
`Mozcko/cvstudio-tools`, and the product is branded **CVStudio.tools**. They are all the same thing.
