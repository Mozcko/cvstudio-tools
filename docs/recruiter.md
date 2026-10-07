# Recruiter area

A separate side of the product for people who hire: upload the CVs received for one vacancy and
get them ranked against the job description, with the evidence behind each score. Code:
`src/components/recruiter/`, `src/lib/recruiter/`, the pages `src/pages/recruiters.astro` and
`src/pages/app/recruiter.astro` (plus their `[lang]` twins). Backend: the `/recruiter` routes
(the backend's `docs/recruiter.md`).

## Pages

| Address | What |
| :--- | :--- |
| `/recruiters` (public) | What it does, how the ranking is produced, the plans, the terms for recruiters. Rendered on the server |
| `/app/recruiter` | Plan and usage, new screening, list of screenings |
| `/app/recruiter?id=<id>` | One screening: criteria, upload, ranking |

The area uses a violet accent (`shared.ts`) so it is never mistaken for the job-seeker side.
It is reached through "¿Eres reclutador?" (`RecruiterAsk.tsx`) on the landing, the pricing
section, the footer and the ATS dialog, plus a link in the header and on the dashboard.

## Plans

Subscription only, through Stripe Checkout; changes and cancellation happen in Stripe's
customer portal ("Gestionar suscripción"). Starter and Pro are bought in the app; Enterprise is
agreed by e-mail: the card shows a "Contáctanos" button only when `PUBLIC_SALES_EMAIL` is set.
Without a plan a user has a one-off free trial. `blockedState()` in `shared.ts` turns the
backend's answer into the four reasons evaluating can be refused (trial used, monthly allowance
used, payment failed, plan ended); in any of them existing screenings stay readable.

The recruiter subscription and the job-seeker passes are independent.

## A screening

1. **Create**: role, job description (50+ characters), language of the results. The backend
   answers with the criteria (the *rubric*): must-haves and nice-to-haves.
2. **Review the criteria**: editable until the first candidate is evaluated, then fixed, so
   every candidate is judged against the same list.
3. **Upload**: many files at once. Each file is read **in the browser**
   (`lib/recruiter/files.ts`) and only its text is sent, three at a time (`lib/recruiter/pool.ts`).
   When the allowance runs out or the screening is full, the files not yet sent are not sent.
4. **Ranking**: best first, the first five marked. Each candidate opens to the criteria met or
   not with the quoted sentence, strengths, concerns, contact details, a private note and a
   display name. CVs containing text addressed to an AI are flagged. CSV export and deletion.

### Files

| Format | How it is read |
| :--- | :--- |
| PDF | `lib/import/pdfText.ts` (shared with CV import) |
| `.docx`, `.odt` | ZIP archives of XML, opened with `fflate` |
| `.rtf`, `.txt`, `.md` | As text |
| `.doc` (old Word), scans, protected files | Refused with a message that says why |

Limits: 10 MB per file, the text cut at 58,000 characters, at least 80 characters.

### CSV

`lib/recruiter/csv.ts`. One line per candidate, one column per criterion. Cells that start with
`=`, `+`, `-` or `@` are prefixed with an apostrophe: the content comes from strangers' CVs and
must not run as a formula when the file is opened in a spreadsheet.

## Other people's data

Recruiters upload third parties' CVs. The AI receives a copy without name or contact details;
the score is computed by the backend from the criteria, not taken from the model; nothing is
rejected automatically; candidate data is deleted after the plan's retention period (90 days
by default). The texts that say so (terms on `/recruiters`, section 7 of the privacy policy)
**need legal review before launch**.

## Tests

- Unit: `lib/recruiter/__tests__` (file readers, CSV, the upload pool).
- Components: `components/recruiter/__tests__` (home, plan gates, uploads, ranking, notes).
- Browser: `tests/signed-in/recruiter.spec.ts`. The recruiter endpoints are answered by a fake
  inside the test, so it needs neither the AI nor Stripe; `tests/public-pages.spec.ts` covers
  the public page and that the app pages are private.
