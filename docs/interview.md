# Voice mock interview

Page: `/app/interview` (and `/en`, `/pt`). Code: `src/components/interview/InterviewApp.tsx`,
`src/hooks/useInterview.ts`, `src/hooks/useRecorder.ts`. Backend: the `/interviews` routes (see
the backend's `docs/api-reference.md` and `docs/ai-services.md`).

A premium feature: **Active Hunt and Lifetime**. Everyone else (free, Sprint Pass) sees an
upgrade screen and the page asks the server for nothing.

## What the user does

1. **Setup** — picks one of their saved CVs (preselected with `?cv=<id>` when coming from the
   editor), pastes the job posting, chooses the language and 4 / 6 / 8 questions.
2. **Room** — the recruiter's line is shown and read aloud; the user taps the microphone, speaks,
   taps again to send. They can type instead, replay the question, skip the audio, turn the voice
   off altogether, or end the interview at any point.
3. **Report** — overall score, strengths, things to improve, what to practise, and for each
   answer: what worked, how to improve it and a stronger sample answer.
4. **History** — past interviews with their score; open one (its report, or the conversation if
   it was left unfinished) or delete it.

## State (`useInterview`)

```
setup → starting → speaking ⇄ listening → thinking → … → finishing → report
```

| Phase | Meaning |
| :--- | :--- |
| `speaking` | A recruiter line is playing. Ends on the audio's `ended`, on "skip", or straight away when the voice is off or the audio could not be fetched |
| `listening` | The candidate's turn: record or type |
| `thinking` | The answer was sent |
| `finishing` | The report is being requested. Entered after the closing line, or from "End interview" |

Things that are deliberate:

- **The server decides the conversation.** The hook only appends the two turns each answer
  returns and plays the reply.
- **Audio is optional everywhere.** If speech cannot be fetched or played, the text is on screen
  and the interview continues. When the browser blocks autoplay, `needsTap` shows a play button
  that plays the already-fetched audio (it is not generated a second time).
- **A failed request changes nothing**: the phase goes back to where a retry makes sense and
  `error` holds a code (`premium`, `dailyLimit`, `monthlyLimit`, `notHeard`, `tooLong`,
  `expired`, `unavailable`, `failed`) that maps to `t.interview.errors`.
- **One report request at a time** (`finishingRef`), because both a click and the phase change
  can ask for it.

## Recording (`useRecorder`)

`MediaRecorder` with the first supported format of WebM/Opus, WebM, MP4 (Safari) and Ogg/Opus
(`pickMimeType`). The recording is sent as the raw request body with its container type. Answers
stop automatically at two minutes and are sent. If the microphone is denied or the browser cannot
record, the room switches to typed answers. The microphone is released when a recording ends or
the page is left.

## Limits shown to the user

`usage.interviews_daily` from `GET /users/me` feeds "Entrevistas disponibles hoy". The backend
enforces the real limits (3 per day, 30 per 30 days by default) and answers `429`.

## Privacy

What is said in an interview is sent to the AI provider as it is, and the voice recording is
sent for transcription and not stored; transcripts and reports are kept until deleted. This is
stated in the privacy policy (`src/i18n/privacy.ts`, section 3).

## Tests

- `src/hooks/__tests__/interview.test.tsx` — the state machine with the API and the audio
  element faked: voice on and off, blocked autoplay, skip, every error, early finish, reopening.
- `src/components/interview/__tests__/InterviewApp.test.tsx` — upgrade screen, setup rules, a
  typed interview through to the report, history, three languages.
- `tests/public-pages.spec.ts` — signed-out visitors are sent to sign in.

- `tests/signed-in/account.spec.ts` — in a real browser: the upgrade screen for a free user and
  a typed interview through to the report, with the interview API answered by the test.

Not covered by any automated test: real microphone capture, real audio playback, and a real
answer from the AI provider.
