# Markdown, PDF and Themes

The rendering pipeline, end to end:

```
CVData ─▶ generateMarkdown() ─▶ Markdown ─▶ <ReactMarkdown rehype-raw> inside .cv-preview-content
                                                        │  + <style>{theme css}</style>
                                                        ▼
                                           usePDFPreview.generatePDF()
                                clone → inline computed styles → html2pdf.js → A4 PDF
                                                        ▼
                                   preview: blob URL in <iframe>   ·   save: file download
```

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
*{role}* | {start} - {end} | Link

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

- Section headings and "Present" are localised from `titlesMap` (es / en / pt).
- Dates go through `Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' })`, giving
  `Jan 2023`, `ene 2023`, `jan. de 2023`.
- Sections are emitted in `sectionOrder`; an empty section is omitted entirely.
- The two-row `<table>` is how company/role and location/dates end up left/right aligned. Every
  theme styles `td:first-child` and `td:last-child`.
- `personal.role` is **not** rendered anywhere in the document.
- A project's `url` only produces the literal text `| Link`; the address itself is not output.

## The parser (`src/utils/markdownParser.ts`)

`parseMarkdownToCV(markdown, lang)` is the inverse, used only when leaving code mode
(see [editor.md](./editor.md)). It returns `{ success, data, warnings }`.

- Splits on `## ` headings; the block before the first one is the header.
- Recognises section titles in **all three languages** regardless of `lang`.
- A certifications heading directly after skills is folded back into the `skills` slot.
- Any unrecognised `## ` heading becomes a custom section.
- Rebuilds `sectionOrder` from the order the headings appear.
- Ids are regenerated from a counter (`"1"`, `"2"`, …); project and custom items get no id.

`titlesMap` is duplicated in the generator and the parser and **must be kept identical** — the
parser file says so in a comment.

Round-trip limits are listed in [known-issues.md](./known-issues.md); the important one is that
some localised month abbreviations do not survive.

## Preview and PDF (`usePDFPreview.ts`, `PreviewPanel.tsx`)

`PreviewPanel` renders two things:

1. A **hidden source**: `<div ref={sourceRef} class="cv-preview-content">` at 21 cm wide, 1 cm
   padding, `opacity-0`, containing the rendered Markdown. A sibling `<style>` holds the theme CSS.
2. An **`<iframe>`** showing the generated PDF blob (`#toolbar=0&view=FitV`, `FitH` on mobile),
   plus a page-count badge.

So the "live preview" is a real PDF, regenerated after each change — what you see is exactly what
downloads.

`generatePDF(mode)`:

1. `mode === 'save'` and not signed in → `alert()` and return (download requires an account).
2. Dynamically import `html2pdf.js`.
3. Clone the source into an off-screen 21 cm container.
4. Walk source and clone in parallel, copying a fixed list of **computed** styles inline
   (typography, borders, padding, margin, display/flex, width…) and stripping `class`. Colours are
   resolved to `rgba()` through a 1×1 canvas, because html2canvas cannot parse modern colour
   functions such as `oklch()` that Tailwind 4 emits.
5. Run html2pdf: A4 portrait, 10 mm margin, JPEG 0.98, canvas scale 2 for save / 1 for preview.
6. Read the page count from jsPDF; either `save()` or create a blob URL (revoking the previous one).

Timing: content changes mark the preview stale; it regenerates after 2 s on desktop, 500 ms on
mobile, and only while the preview panel is visible.

Implications when editing themes:

- **Only the properties copied in `applyComputedStyles` reach the PDF.** Pseudo-elements
  (`::before`, `::after`, `::marker`), `gap`, transforms, etc. are dropped.
- The output is a rasterised image per page, so the PDF text is not selectable or machine-readable.
- The downloaded file is named `{personal.name with underscores}_CV.pdf`.

The dashboard thumbnails (`ResumeCard`) do not use this pipeline: they render the same Markdown as
live HTML, scaled with `transform: scale()` to fit the card, with the theme CSS re-scoped to
`#cv-preview-{id}` so several themes can coexist on one page.

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
bundled stylesheet. Selecting a theme stores both its id and its full CSS text in `localStorage`.

`getThemeById(id)` falls back to the first theme.

### Adding a theme

1. Create `src/templates/my_theme.css`. Prefix **every** selector with `.cv-preview-content`.
2. Style at least: the root, `h1`, `p:first-of-type` (the contact line), `h2`, `h3`, `table`,
   `td:first-child`, `td:last-child`, `ul`, `li`, `strong`, `a`.
3. Register it in `src/templates/index.ts` with a unique `id`, a display `name` and a swatch `color`.
4. Check the result in the **PDF preview**, not just in DevTools — see the property list above.
5. Do not rename existing ids: they are stored in users' browsers and in the backend's `theme`
   column.
