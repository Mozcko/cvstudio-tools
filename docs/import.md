# Importing an existing CV

Code: `src/lib/import/`, dialog in `src/components/editor/ImportModal.tsx`. Backend half:
`POST /ai/import` (see the backend's `docs/api-reference.md` and `docs/ai-services.md`).

## Formats

| File | How it is read | AI | Works for guests |
| :--- | :--- | :---: | :---: |
| LinkedIn data export (`.zip`) | `linkedinZip.ts` — the CSV files inside | no | ✅ |
| JSON Resume (`.json`, or the same data as `.yaml` / `.toml`) | `structured.ts` | no | ✅ |
| RenderCV (`.yaml`) | `structured.ts` | no | ✅ |
| CVStudio's own `CVData` as JSON | `structured.ts` | no | ✅ |
| PDF | `pdfText.ts` extracts the text → `POST /ai/import` | yes | sign-in required |
| Any other JSON / YAML / TOML / XML | sent as text → `POST /ai/import` | yes | sign-in required |

The syntax of a data file only decides which parser runs. The mapping is chosen from the
**shape** of the parsed data (`mapStructured`): `basics` → JSON Resume, `cv.sections` → RenderCV,
`personal` + `experience` → our own. Anything else goes to the AI. There is no rule-based XML
mapping: XML resumes have no common schema, so they always take the AI path.

Files are never uploaded. Everything is read in the browser; for the AI path only the extracted
text is sent (at most 58 000 characters).

## Flow

```
ImportModal.handleFile(file)
  prepareImport(file, lang)             detect.ts: kind from magic bytes / extension, size limits
    ├─ ready    → ImportResult          rule-based formats
    └─ needsAi  → { text, source }      PDF or unknown data file
  runAiImport(prepared, lang, token)    guests stop here with "needsAuth"
  onImported(result, fileName)
```

Every result, rule-based or from the AI, passes through `normalizeImported` (`normalize.ts`).
It is the only gate into the editor: it builds a valid `CVData` with fresh ids, strips markup
(the sheet renders raw HTML), keeps only `http(s)` links, coerces dates to `YYYY-MM`, and caps
string and list sizes. `missing` lists the parts it could not fill (name, experience, education,
skills), which the UI reports.

Libraries (`pdfjs-dist`, `fflate`, `papaparse`, `yaml`, `smol-toml`, `fast-xml-parser`) are loaded
with dynamic `import()` the first time a file of that kind is chosen; they are not in the editor
bundle.

## Entry points

- **Editor** (toolbar button): `useCVLogic.handleImport` replaces the open CV as one undo step,
  switches to form mode and marks the CV dirty (so it autosaves like any edit). The title is set
  only if it was empty.
- **Dashboard** ("Import CV"): creates a new CV with `api.createCV` and opens it. The free-plan
  CV limit is checked *before* the dialog opens, so nobody spends an AI import on a CV they
  cannot save.

## Limits and errors

| Limit | Value |
| :--- | :--- |
| PDF | 10 MB, first 15 pages |
| LinkedIn ZIP | 30 MB (only the CSV files read are inflated) |
| Data files | 2 MB |
| Free AI imports | `FREE_IMPORT_LIMIT` on the backend (2), lifetime |

`ImportError.code` → message in `t.import.errors`: `unsupported`, `tooLarge`, `unreadable`
(corrupt, invalid syntax or password-protected), `noText` (scanned PDF), `notLinkedin`, `empty`,
`needsAuth`, `limit` (`403`), `rateLimited` (`429`), `failed`.

## Not supported

Scanned PDFs (no OCR), DOCX, importing from a LinkedIn profile URL, and keeping the layout of
the original PDF.

## Tests

- `src/lib/import/__tests__/import.test.ts` — every format, limits, hostile input, error mapping.
- `useCVLogic.test.tsx` → "import" — replace + undo.
- `tests/import.spec.ts` — in a browser as a guest: JSON / YAML / TOML, a LinkedIn ZIP, a real
  PDF (text extraction, then the sign-in prompt), a PDF without text, rejected files, and that
  an imported file cannot inject markup.
