# Markdown, PDF and Themes

The rendering pipeline, end to end:

```
CVData ─▶ generateMarkdown() ─▶ Markdown ─▶ <ReactMarkdown rehype-raw> inside .cv-preview-content
                                                        │  + <style>{theme css}</style>
                                     ┌──────────────────┴───────────────────┐
                              PreviewPanel                           printHtml()
                     scaled A4 sheet on screen          same HTML + theme CSS in a hidden iframe
                                                         → browser print → "Save as PDF"
```

The preview and the PDF are the same HTML and the same CSS, laid out by the same browser engine.

## Language-dependent pieces (`src/utils/cvLocale.ts`)

One module owns everything in the document that changes with the language, and both the generator
and the parser import it:

- `titlesMap` — section headings for es / en / pt, and `titleToKey` for the reverse lookup.
- `presentLabel` / `isPresent` — "Presente" / "Present".
- `formatMonth('2023-04', lang)` → `abr 2023` · `Apr 2023` · `abr 2023`, from fixed month tables.
- `parseMonth(text)` — the inverse, tolerant of hand-written variants (`abril de 2023`,
  `Abr. 2023`, `sept 2023`, `2023-04`, `04/2023`, `2023`).
- `splitDateRange('abr 2023 - Presente')`.

Dates deliberately do **not** use `Intl` or `new Date(string)`: their output and parsing differ
between browsers and ICU versions, which used to break the round trip.

## The Markdown dialect (`src/utils/markdownGenerator.ts`)

`generateMarkdown(data, lang)` emits a fixed structure. Themes and the parser both depend on it, so
treat it as a format, not as free-form Markdown.

```markdown
# {name}

**{city}** | **{email}** | **{phone}**
<br>
**[{network}]({url})** | **[{network}]({url})**

{summary}

## Professional Experience

<table>
  <tr>
    <td><strong>{company}</strong></td>
    <td><em>{role}</em></td>
  </tr>
  <tr>
    <td><em>{location}</em></td>
    <td><em>{start} - {end}</em></td>
  </tr>
</table>

- {bullet}

## Key Projects

### {project name}
*{role}* | {start} - {end} | [Link]({url})

- {bullet}

## Education

**{degree}**
<br>
*{institution} | {start} - {end}*

## Technical Skills

- **{category}:** {items}
## Certifications

- **{category}:** {items}

**Languages:** {languages}
<br>
**Interests:** {interests}

## {custom section title}

### {item title}
*{item subtitle}*

{item description}
```

Rules:

- Sections are emitted in `sectionOrder`; an empty section is omitted entirely.
- Empty contact fields are omitted from the contact line (no empty `****`).
- Each part of a project's meta line (role, dates, link) is optional and only printed if present.
- The two-row `<table>` is how company/role and location/dates end up left/right aligned. Every
  theme styles `td:first-child` and `td:last-child`.
- `personal.role` is **not** rendered anywhere in the document.

## The parser (`src/utils/markdownParser.ts`)

`parseMarkdownToCV(markdown)` is the inverse, used only when leaving code mode
(see [editor.md](./editor.md)). It returns `{ success, data, warnings }`.

- Pulls the `**Languages:**` / `**Interests:**` lines out first, wherever they are.
- Splits on `## ` headings; the block before the first one is the header.
- Recognises section titles in **all three languages**, whatever the editor language is.
- A certifications heading belongs to the `skills` slot.
- Any unrecognised `## ` heading becomes a custom section.
- When the contact line has fewer than three parts, it classifies them (contains `@` → email,
  looks like a phone number → phone, otherwise city).
- Rebuilds `sectionOrder` from the order the headings appear.
- Ids are regenerated from a counter (`"1"`, `"2"`, …) for every entry, project and custom item.

The round trip *generate → parse → generate* is covered by
`src/utils/__tests__/markdownRoundTrip.test.ts` for all three languages and every month. **Any
change to the generator needs the matching change in the parser and should extend that test.**

## Preview (`PreviewPanel.tsx`)

The right-hand panel renders the Markdown into a real `.cv-preview-content` element on a white
sheet 794 px wide (A4 at 96 dpi) with 1 cm padding, and scales the whole sheet with
`transform: scale()` to fit the panel (`src/hooks/useFitScale.ts`, also used by the dashboard
thumbnails). It updates instantly as you type.

`usePrintPreview` watches the sheet with a `ResizeObserver` and derives:

- `pageCount` — content height ÷ printable height of an A4 page with 1 cm margins (277 mm);
- dashed guides where page breaks are expected.

Both are estimates; the print engine makes the final decision.

## PDF export (`src/utils/printDocument.ts`)

`printHtml({ title, css, html, wrapperClass })`:

1. Builds a standalone HTML document: a reset, `@page { size: A4; margin: 1cm }`, the theme CSS,
   and the sheet's `innerHTML` inside `<div class="print-root cv-preview-content">`.
2. Loads it in a hidden iframe (`srcdoc`), waits for `document.fonts.ready`.
3. Sets the document title (browsers use it as the suggested file name) and calls `print()`.
4. Cleans up on `afterprint`.

The user picks **Save as PDF** in the dialog. Because the browser's own print engine produces the
file, the text is real text: selectable, searchable and readable by ATS parsers.

Two details that matter when touching this:

- **The reset.** The on-screen preview lives inside the app, where Tailwind's preflight applies
  (no list bullets, no heading sizes, zero margins, `border-box`), and the themes were written
  against that. The print document has no Tailwind, so `PREFLIGHT_CSS` in `printDocument.ts`
  reproduces the relevant rules. If a theme looks different in the PDF than in the preview, the
  cause is almost always a preflight rule missing there.
- **Margins.** On screen the sheet has 1 cm padding; in print the padding is forced to 0 and the
  `@page` margin takes its place. A theme may override `@page` inside `@media print` (the Basic
  theme does).

`CoverLetterModal` uses the same `printHtml` for its "Download PDF" button.

The export requires sign-in (`CVBuilder.handlePrint` opens the sign-in prompt for guests).

## Themes (`src/templates/`)

A theme is a plain CSS file whose selectors are all scoped under `.cv-preview-content`, registered
in `src/templates/index.ts`:

| id | Name | File |
| :--- | :--- | :--- |
| `hardvard` *(sic)* | Harvard classic | `render_classic.css` |
| `basic` | Basic | `basic.css` |
| `modern-split` | Modern Split | `modern_split.css` |
| `modern` | Elegant | `modern.css` |
| `minimal` | Minimal | `minimal.css` |

The CSS is imported with Vite's `?raw` suffix, so it is a string injected via `<style>`, not a
bundled stylesheet. `DEFAULT_THEME_ID` is the first theme; `getThemeById(id)` falls back to it.

The theme **id** is stored with the CV (in the local draft and in the backend's `theme` column);
the CSS is always looked up from the id.

The dashboard thumbnails render the same Markdown with the CV's theme, re-scoped to
`#cv-preview-{id}` so several themes can coexist on one page.

### Adding a theme

1. Create `src/templates/my_theme.css`. Prefix **every** selector with `.cv-preview-content`.
2. Style at least: the root, `h1`, `p:first-of-type` (the contact line), `h2`, `h3`, `table`,
   `td:first-child`, `td:last-child`, `ul`, `li`, `strong`, `a`. Remember the reset: lists have no
   bullets and headings no size unless you set them.
3. Register it in `src/templates/index.ts` with a unique `id`, a display `name` and a swatch `color`.
4. Check it in the preview **and** in a downloaded PDF. Pseudo-elements, flexbox and backgrounds
   all print.
5. Add `break-inside: avoid` for blocks that should not be split across pages.
6. Do not rename existing ids: they are stored with users' CVs.
