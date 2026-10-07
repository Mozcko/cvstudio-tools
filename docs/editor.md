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
├─ PreviewPanel                   right column: the CV rendered on a scaled A4 sheet
├─ ATSModal, CoverLetterModal, OptimizeModal, AIChoiceModal, AuthRequiredModal
├─ MobileNavigation               editor/preview tabs below 1024px
└─ Toast[]
```

`CVBuilder` owns no CV state itself. It calls two hooks and passes their results down as props;
there is no context or store.

| Hook | File | Responsibility |
| :--- | :--- | :--- |
| `useCVLogic(t, lang)` | `CVBuilder/hooks/useCVLogic.ts` | All CV state, load/save, drafts, history, AI, gating, toasts |
| `usePrintPreview(css, title)` | `CVBuilder/hooks/usePrintPreview.ts` | Measures the preview sheet (page estimate) and prints it (see [markdown-pdf-themes.md](./markdown-pdf-themes.md)) |

## State inside `useCVLogic`

All of it is plain React state; persistence happens through the draft (below) and the backend.

| State | Meaning |
| :--- | :--- |
| `resumeId` | Backend id of the CV, taken from the URL (`?id=`). `null` = never saved |
| `rawData` | The CV as stored |
| `cvData` | derived — `rawData` normalised (arrays guaranteed, section order completed). **Use this for reading** |
| `editMode` | `'form'` or `'code'` |
| `codeMarkdown` | The Markdown the user typed; only meaningful in code mode |
| `markdown` | derived — generated from `cvData` in form mode, `codeMarkdown` in code mode |
| `activeThemeId` | Theme of this CV. `customCSS` is derived from it with `getThemeById` |
| `resumeTitle` | Shown in the toolbar; sent as the CV title |
| `isDirty`, `saveStatus` | `saveStatus` ∈ `idle · saving · saved · error` |
| `autosavePaused` | Set by Reset; cleared by the next edit or explicit save |
| `past`, `future` | Undo / redo stacks of `CVData` snapshots |
| `isPro`, `isGuest` | From `/users/me` and Clerk. `isGuest` is `false` while Clerk is still loading |
| `isInitializing` | `true` from first render while a `?id=` CV is being fetched |
| modal flags, `pendingAiData`, `toasts` | UI plumbing |

Every form mutation goes through `handleDataChange(newData)`; every kind of edit ends in
`markEdited()`, which sets `isDirty`, resets `saveStatus` to `idle` and un-pauses autosave.

## Local drafts (`src/lib/cvDraft.ts`)

Each CV has its own entry in `localStorage`:

| Key | Holds |
| :--- | :--- |
| `cv-draft:<backend id>` | Working copy of that CV |
| `cv-draft:new` | The one unsaved draft — everything a guest does, or a signed-in user before the first save |

A draft is `{ data, themeId, title, mode, markdown, dirty, updatedAt }`. An effect in `useCVLogic`
rewrites it whenever any of those change (not while loading). Guests always use the `new` key,
whatever the URL says.

`dirty` is what makes drafts safe: it is `true` only while the browser has changes the server does
not. On first run, `migrateLegacyDraft` converts the old single-draft keys (`cv-data`,
`cv-resume-id`, `cv-theme-id`, `cv-custom-css`) and deletes them.

## Loading

On mount, once Clerk has loaded (`useCVLogic.ts`, "Initial load" effect):

| Situation | Result |
| :--- | :--- |
| No `?id=` | Show the `new` draft (or the sample CV) |
| `?id=`, signed out | Show the `new` draft and open the sign-in prompt |
| `?id=`, signed in, local draft for that id is `dirty` | Local draft wins; it is autosaved shortly after |
| `?id=`, signed in, otherwise | Server copy wins. Markdown-mode content opens in code mode |
| `?id=` unknown or not the user's (404 / 403 / 422) | Drop the id from the URL, show the `new` draft, toast "not found" |
| Network / server failure | Keep any local draft for that id, toast an error |

## Saving

`handleSave`:

1. Guest → open the sign-in prompt and stop.
2. Skip if already saving, or if clean and already saved.
3. Build `{ title, content, language, theme }`. `content` is `cvData` in form mode and
   `{ mode: 'markdown', markdown }` in code mode. An empty title defaults to the role, the name, or
   the first `# heading`.
4. `resumeId` set → `PUT /cvs/{id}`; if that answers 404 or 403 the work is saved as a new CV
   instead. No `resumeId` → `POST /cvs/`. After a create, the draft moves to the new id's key and
   the URL becomes `…/app/editor?id=<id>` (keeping the locale prefix).
5. If the user edited during the request, stay dirty so the next autosave sends the newer state.
6. A `403` on create means the free-plan limit: the upgrade prompt opens instead of an error toast.

Triggers:

| Trigger | Where |
| :--- | :--- |
| Save button, `Ctrl/Cmd + S` | `EditorToolbar`, `CVBuilder.tsx` |
| Autosave | `CVBuilder.tsx` — 3 s after the last change |

The hook exposes the decision as `shouldAutosave`; `CVBuilder` only runs the timer. Autosave only runs when **all** hold: the CV has an id, the user is signed in, it is dirty,
`saveStatus` is `idle`, and autosave is not paused. So:

- the first save of a new CV is always manual;
- after a failed save (`saveStatus === 'error'`) nothing is retried until the next edit;
- after **Reset** the sample data is not pushed over the cloud copy until the user edits or saves.

## Form mode vs code mode

- **Form mode** (default): the form edits `CVData`; `markdown` is derived from it.
- **Code mode**: the user edits Markdown directly. `CVData` is left untouched and the form is
  hidden. A banner warns that changes do not flow back to the visual editor.

Switching **form → code** copies the generated Markdown into `codeMarkdown`. Switching
**code → form** goes through `handleSetEditMode`:

1. `parseMarkdownToCV(codeMarkdown)` builds a `CVData`.
2. That data is regenerated and compared with the user's text (whitespace-normalised).
3. Only an exact round trip is accepted (and pushed as an undo step). Otherwise the editor stays
   in code mode with the `parseError` toast, so hand-written Markdown is never silently discarded.

## Undo / redo

- Stacks hold whole `CVData` snapshots, capped at 50.
- A burst of edits is one step: the state *before the first edit* of the burst is remembered and
  committed to `past` 800 ms after the last one. Undo during those 800 ms still works — the pending
  snapshot is flushed first.
- Reset, "apply AI result" and a successful code → form switch push a snapshot immediately.
- Shortcuts on `window`: `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y` redo.
- History covers form data only — not Markdown edits in code mode, the theme or the title.

## Section reordering

`sectionOrder` drives both the form and the generated Markdown. Three ways to change it, all in
`CVForm.tsx`: the up/down arrows in each `SectionHeader`; the reorder toggle in `EditorPanel`'s
toolbar, which swaps the form for a drag list (HTML5 drag events); and the same list on touch
devices. The personal block is always first and is not part of the order.

## Responsive behaviour

At ≥ 1024 px both panels are visible (5/12 + 7/12, or 4/12 + 8/12 at `xl`). Below that,
`MobileNavigation` switches a single visible panel via `mobileTab`. The preview scales itself to the
panel width (`useFitScale`), and downloading works from either tab.

## Toolbar actions at a glance

| Action | Handler | Notes |
| :--- | :--- | :--- |
| Title input | `handleTitleChange` | Marks dirty |
| Language toggle | `toggleLang` | Cycles es → en → pt; changes UI strings **and** the CV's section headings and dates |
| Undo / redo | `handleUndo` / `handleRedo` | |
| AI menu | `handleAiAction`, modal openers | See [auth-billing-ai.md](./auth-billing-ai.md) |
| Save | `handleSave` | |
| Share | `ShareModal` | Only for a saved CV of a signed-in user. See [sharing.md](./sharing.md) |
| Import | `ImportModal` → `handleImport` | Replaces the open CV as one undo step. See [import.md](./import.md) |
| Reset | `handleReset` | `confirm()`, restores the sample CV and default theme, pauses autosave |
| Download PDF | `handlePrint` → `usePrintPreview.print()` | Requires sign-in; opens the print dialog |
