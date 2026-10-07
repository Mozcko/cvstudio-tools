# Public links and view statistics

A CV can be published at `/u/<key>/<name>`, e.g. `/u/k7f2m9qx/juan-perez`. The **key** (8 random
characters from the backend) identifies the link; the **name** is chosen by the owner so the
address reads well and does not have to be unique. Code: the page `src/pages/u/[key]/[...name].astro`, the renderer
`src/components/share/PublicCvSheet.tsx`, the dialog `src/components/share/ShareModal.tsx`, name
rules in `src/lib/publicLinks.ts`. Backend: the `/public`, `/links` and `/cvs/{id}/link` routes
(the backend's `docs/api-reference.md`).

## Rules

- One link per CV. The owner picks the name (renaming keeps the key, so addresses already shared
  keep working), can switch the link off, chooses whether e-mail and
  phone are shown (**phone is off by default**) and whether search engines may list the page
  (off by default).
- Free plan: one active link, with a "Hecho con CVStudio" badge, total views only. Pro: a link
  per CV, no badge, views per day and top referrers. When Pro ends the oldest link stays online
  and the others show as *paused*.

## The public page

Rendered **on the server** from `GET /public/cv/{key}`, which already has the hidden contact
details removed. No React runs in the visitor's browser.

```
/u/<key>/<name>  →  no valid key?              → 404 page (no request made)
                 →  backend says 404            → 404 page
                 →  backend unreachable/error   → 503 with a short message
                 →  not the current address     → 301 to /u/<key>/<current name>
                 →  otherwise                   → the CV, in the CV's own language and theme

"Not the current address" covers a name the link used to have, the key alone (`/u/<key>`),
different casing, and the shape `<name>-<key>` that existed briefly.
```

The page is not localized by URL: `<html lang>`, the button texts and the section headings follow
the language stored with the CV. `/u/…` is public in `src/lib/routes.ts` and skipped by the
locale redirect.

### Sanitizing — the part that must not regress

A published CV is text written by a user, shown on **our own origin**, where visitors may be
signed in. The editor's preview allows raw HTML; the public page does not. `PublicCvSheet` runs
the generated Markdown through `rehype-sanitize` with `PUBLIC_CV_SCHEMA`:

- only the tags the CV generator produces (headings, paragraphs, lists, emphasis, links, the
  header table, the role block);
- `href` only on links, and only `http`, `https` and `mailto`;
- no `style`, `class` (except the role block), `id` or event-handler attributes;
- `script`, `style`, `iframe`, `svg`, forms and images are removed, with their content.

Links open in a new tab with `rel="nofollow ugc noopener noreferrer"`. The theme stylesheet is
looked up by id among our own themes; the stored value is never written into the page.

`src/components/share/__tests__/PublicCvSheet.test.tsx` and the "cannot run or load anything"
browser test hold this in place. **Any new tag or attribute the generator starts to emit has to
be added to the schema, or it will silently disappear from public pages.**

### Counting a view

An inline script waits two seconds, checks the page is visible, and posts to
`/public/cv/{key}/view` with the referrer. It does nothing when:

- the address has `?preview=1` (the link in the sharing dialog uses it), or
- the key is in `localStorage['cvstudio:own-links']`, which the dashboard fills with the keys of
  the user's own links — so owners do not inflate their own numbers.

What the backend stores is described in its `docs/architecture.md`: an anonymous identifier that
changes daily and the referring host; no IP address, no cookie.

## Sharing dialog

Opened from each dashboard card and, for a saved CV, from the editor toolbar. It loads the CV's
link itself when it opens. The name is suggested from the person's name (`suggestSlug`) and checked
as the user types (`slugProblem`, a mirror of the backend rules). There is no "name taken": the
key makes every address unique. Errors from saving map to: `403` → the free-plan message with
an upgrade link, `422` → invalid name.

Statistics in the dialog: totals for everyone; for Pro a 30-day bar chart and the top referrers.

## Dashboard

Cards of published CVs show a "Público" tag, the view count and a `+N nuevas` badge. After the
list is loaded the dashboard calls `POST /links/seen`, so the badge shows views since the
previous visit. A failure to load links never hides the CVs.
