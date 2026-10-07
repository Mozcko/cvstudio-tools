<div align="center">
  <p>
    <a href="#english">🇺🇸 English</a> | <a href="#español">🇪🇸 Español</a>
  </p>
</div>

---

<div id="english"></div>

# 📄 CVStudio.tools

[![CI](https://github.com/Mozcko/cvstudio-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/Mozcko/cvstudio-tools/actions/workflows/ci.yml)
[![Security](https://github.com/Mozcko/cvstudio-tools/actions/workflows/security.yml/badge.svg)](https://github.com/Mozcko/cvstudio-tools/actions/workflows/security.yml)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

The web app behind [cvstudio.tools](https://www.cvstudio.tools): build a résumé in a form or in
Markdown, see it live on an A4 sheet, pick a theme, and download a PDF with real, selectable text.
Signed-in users keep their CVs in the cloud; Pro users get AI rewriting, job-targeted optimisation,
translation, ATS simulation and cover letters.

> **Documentation:** [`docs/`](./docs/README.md) · **Contributing:** [`CONTRIBUTING.md`](./CONTRIBUTING.md) · **Security:** [`SECURITY.md`](./SECURITY.md)

This repository is the frontend. Data, billing and AI live in the API:
[`Mozcko/cvstudio-tools-backend`](https://github.com/Mozcko/cvstudio-tools-backend).

## Stack

Astro (server-rendered, Node adapter) · React islands · Tailwind CSS · Clerk for authentication ·
Vitest · deployed on Railway.

## Quick start

You need **Node 22.12 or newer** and **pnpm**.

```bash
pnpm install
cp .env.example .env      # fill in the three values below
pnpm dev                  # http://localhost:4321
```

| Variable | What |
| :--- | :--- |
| `PUBLIC_API_URL` | Backend base URL including `/api/v1`, e.g. `http://localhost:8000/api/v1` |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (use a development instance locally) |
| `CLERK_SECRET_KEY` | Clerk secret key for the same instance |

The editor works as a guest without the backend; saving, the dashboard and the AI tools need it
running (see the backend repository).

## Scripts

| Command | Does |
| :--- | :--- |
| `pnpm dev` | Development server with hot reload |
| `pnpm check` | Everything CI checks: lint, type-check, unit tests, build |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` | The individual checks |
| `pnpm format` | Format with Prettier |
| `pnpm start` | Run the production build (`node dist/server/entry.mjs`) |

## Where things are

| Path | What |
| :--- | :--- |
| `src/pages/` | Routes. Spanish at the root, English and Portuguese under `[lang]/` |
| `src/components/editor/` | The CV editor: form, Markdown mode, preview, AI tools |
| `src/utils/` | Markdown generator and parser, print-to-PDF |
| `src/templates/` | CV themes (CSS) |
| `src/lib/` | Backend client, local drafts, public-route rules |
| `src/i18n/` | All translated strings |
| `docs/` | Architecture, editor, data model, themes and PDF, auth and plans, i18n, development |

## License

MIT — see [`LICENSE`](./LICENSE).

---

<div id="español"></div>

# 📄 CVStudio.tools

La aplicación web de [cvstudio.tools](https://www.cvstudio.tools): crea tu currículum con un
formulario o en Markdown, míralo en vivo sobre una hoja A4, elige un tema y descarga un PDF con
texto real y seleccionable. Los usuarios registrados guardan sus CVs en la nube; los usuarios Pro
tienen mejora de redacción con IA, optimización para una vacante, traducción, simulador ATS y
cartas de presentación.

> **Documentación:** [`docs/`](./docs/README.md) (en inglés) · **Cómo contribuir:** [`CONTRIBUTING.md`](./CONTRIBUTING.md) · **Seguridad:** [`SECURITY.md`](./SECURITY.md)

Este repositorio es el frontend. Los datos, los pagos y la IA viven en la API:
[`Mozcko/cvstudio-tools-backend`](https://github.com/Mozcko/cvstudio-tools-backend).

## Tecnologías

Astro (renderizado en servidor, adaptador de Node) · islas de React · Tailwind CSS · Clerk para
autenticación · Vitest · desplegado en Railway.

## Inicio rápido

Necesitas **Node 22.12 o superior** y **pnpm**.

```bash
pnpm install
cp .env.example .env      # completa los tres valores de abajo
pnpm dev                  # http://localhost:4321
```

| Variable | Qué es |
| :--- | :--- |
| `PUBLIC_API_URL` | URL base del backend, con `/api/v1`, p. ej. `http://localhost:8000/api/v1` |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Clave pública de Clerk (usa una instancia de desarrollo en local) |
| `CLERK_SECRET_KEY` | Clave secreta de Clerk de la misma instancia |

El editor funciona como invitado sin el backend; para guardar, usar el panel y las herramientas de
IA hace falta tenerlo en marcha (ver el repositorio del backend).

## Scripts

| Comando | Acción |
| :--- | :--- |
| `pnpm dev` | Servidor de desarrollo con recarga en caliente |
| `pnpm check` | Todo lo que revisa el CI: lint, tipos, pruebas unitarias y build |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` | Las revisiones por separado |
| `pnpm format` | Formatea con Prettier |
| `pnpm start` | Ejecuta el build de producción (`node dist/server/entry.mjs`) |

## Licencia

MIT — ver [`LICENSE`](./LICENSE).
