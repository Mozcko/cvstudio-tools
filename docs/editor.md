# The Editor

Everything under `/app/editor`. Entry point: `src/components/editor/CVBuilder/CVBuilder.tsx`.

## Component tree

```
CVBuilder                         layout, keyboard shortcuts, autosave timer, modal wiring
├─ GuestBanner                    only when signed out
├─ EditorToolbar                  title, language toggle, undo/redo, AI menu, save, reset, download
│   ├─ AITools                    dropdown: enhance / optimize / translate / cover letter / ATS
│   └─ UserMenu                   Clerk UserButton or "sign in"
├─ EditorPanel                    left column
│   ├─ ThemeSelector
│   ├─ CVForm                     form mode
│   │   ├─ SocialsEditor, SectionHeader, InfoBanner
│   │   ├─ ExperienceItem / EducationItem / ProjectItem   (SectionItems.tsx)
│   │   ├─ SimpleListEditor (bullets) / DynamicListEditor (category: items)   (ListEditors.tsx)
│   │   └─ CustomSectionsEditor
│   └─ react-simple-code-editor   code mode
├─ PreviewPanel                   right column: hidden HTML source + PDF iframe
├─ ATSModal, CoverLetterModal, OptimizeModal, AIChoiceModal, AuthRequiredModal
├─ MobileNavigation               editor/preview tabs below 1024px
└─ Toast[]
```

`CVBuilder` owns no CV state itself. It calls two hooks and passes their results down as props;
there is no context or store.

| Hook | File | Responsibility |
| :--- | :--- | :--- |
| `useCVLogic(t, lang)` | `CVBuilder/hooks/useCVLogic.ts` | All CV state, load/save, history, AI, gating, toasts |
| `usePDFPreview(markdown, css, …)` | `CVBuilder/hooks/usePDFPreview.ts` | Turns the hidden HTML into a PDF (see [markdown-pdf-themes.md](./markdown-pdf-themes.md)) |

## State inside `useCVLogic`

| State | Persisted | Meaning |
| :--- | :--- | :--- |
| `rawData` | `localStorage['cv-data']` | The CV as stored |
| `cvData` | derived | `rawData` normalised (arrays guaranteed, section order completed) — **use this for reading** |
| `markdown` | no | What the preview renders. Derived in form mode, user-owned in code mode |
| `editMode` | no | `'form'` or `'code'` |
| `resumeId` | `localStorage['cv-resume-id']` | Backend id, or `null` for an unsaved draft |
| `resumeTitle` | no | Shown in the toolbar; sent as the CV title |
| `activeThemeId`, `customCSS` | `localStorage` | Theme selection |
| `isDirty`, `saveStatus` | no | `saveStatus` ∈ `idle · saving · saved · error` |
| `past`, `future` | no | Undo / redo stacks of `CVData` snapshots |
| `isPro`, `isGuest` | no | From `/users/me` and Clerk |
| `isInitializing` | no | `true` from first render while a `?id=` CV is being fetched |
| modal flags, `pendingAiData`, `toasts` | no | UI plumbing |

Every mutation goes through `handleDataChange(newData)`, which writes `rawData`, sets
`isDirty = true` and `saveStatus = 'idle'`, and schedules a history snapshot.

## Form mode vs code mode

- **Form mode** (default): the form edits `CVData`; an effect regenerates `markdown` whenever
  `cvData`, `lang` or `editMode` change (`useCVLogic.ts:160`).
- **Code mode**: the user edits `markdown` directly. `CVData` is left untouched and the form is
  hidden. A yellow banner warns that changes do not flow back to the visual editor.

Switching **form → code** is free. Switching **code → form** goes through `handleSetEditMode`
(`useCVLogic.ts:288`):

1. `parseMarkdownToCV(markdown)` builds a `CVData`.
2. That data is regenerated to Markdown and compared with the user's text (whitespace-normalised).
3. Only an exact round-trip is accepted. Otherwise the editor stays in code mode and shows the
   `parseError` toast, so hand-written Markdown is never silently discarded.

Consequence: any Markdown the generator would not itself produce locks the CV in code mode.

## Loading

On mount, once Clerk is loaded **and** a user is signed in (`useCVLogic.ts:167`):

- `?id=<uuid>` present → `setResumeId(id)`, `GET /cvs/{id}`.
  - `content.mode === 'markdown'` → put it in `markdown`, switch to code mode.
  - otherwise → `setRawData({...content, language})`, form mode.
  - 404 → clear `resumeId`, strip the query string, toast "CV not found, starting fresh".
- no `id` → nothing is fetched; the editor shows the `localStorage` draft.

Guests never hit the API; they always work on the `localStorage` draft.

## Saving

`handleSave` (`useCVLogic.ts:332`):

1. Guest → open the auth modal and stop.
2. Skip if already saving, or if clean and already saved.
3. Build the payload: `cvData` in form mode, `{mode:'markdown', markdown}` in code mode. If the
   title is empty it defaults to the role (form) or the first `# heading` (code).
4. `resumeId` set → `PUT /cvs/{id}`; on 404 fall back to creating a new CV. No `resumeId` →
   `POST /cvs/` with a fresh UUID. After a create, the URL is rewritten to `/app/editor?id=…`.
5. Compare the data captured at step 3 with the current refs; if the user typed during the
   request, stay dirty so the next autosave picks it up.

Triggers:

| Trigger | Where |
| :--- | :--- |
| Save button | `EditorToolbar` |
| `Ctrl/Cmd + S` | `CVBuilder.tsx:91` |
| Autosave | `CVBuilder.tsx:116` — 3 s after the last change, only if `resumeId` exists and `isDirty` |

A draft that has never been saved has no `resumeId`, so **the first save is always manual**.

## Undo / redo

- Stacks hold whole `CVData` snapshots; `past` is capped at 50 on the debounced path.
- `handleDataChange` debounces snapshots by 800 ms so a burst of typing becomes one history entry.
- Reset and "apply AI result" push a snapshot immediately (`pushImmediateHistory`).
- Shortcuts are registered on `window`: `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y` redo.
- History covers form data only — not Markdown edits in code mode, the theme or the title.

## Section reordering

`sectionOrder` drives both the form and the generated Markdown. Three ways to change it, all in
`CVForm.tsx`:

- up/down arrows in each `SectionHeader`;
- the reorder toggle in `EditorPanel`'s toolbar, which swaps the form for a compact drag list
  (HTML5 drag events);
- the same list on touch devices (`onTouchStart/Move/End` + `document.elementFromPoint`).

The personal block is always first and is not part of the order.

## Responsive behaviour

`CVBuilder` tracks `window.innerWidth`. At ≥ 1024 px both panels are visible (5/12 + 7/12, or
4/12 + 8/12 at `xl`). Below that, `MobileNavigation` switches a single visible panel via
`mobileTab`. Downloading from the editor tab on mobile first flips to the preview tab and waits
300 ms so the hidden source is laid out.

## Toolbar actions at a glance

| Action | Handler | Notes |
| :--- | :--- | :--- |
| Title input | `setResumeTitle` wrapper | Marks dirty |
| Language toggle | `toggleLang` | Cycles es → en → pt; changes UI strings **and** regenerated section headings/dates |
| Undo / redo | `handleUndo` / `handleRedo` | |
| AI menu | `handleAiAction`, modal openers | See [auth-billing-ai.md](./auth-billing-ai.md) |
| Save | `handleSave` | |
| Reset | `handleReset` | `confirm()`, restores `initialCVData` and the first theme; keeps `resumeId` |
| Download PDF | `handlePrint` → `generatePDF('save')` | Requires sign-in |
