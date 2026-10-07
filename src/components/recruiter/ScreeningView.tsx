import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/astro/react';
import {
  api,
  isApiError,
  type Candidate,
  type RecruiterStatus,
  type Requirement,
  type Screening,
} from '../../lib/api';
import type { Translation } from '../../i18n/locales';
import type { CVLang } from '../../types/cv';
import { downloadCsv, rankingToCsv } from '../../lib/recruiter/csv';
import {
  ACCEPTED_CV_FILES,
  CandidateFileProblem,
  readCandidateFile,
  type CandidateFileError,
} from '../../lib/recruiter/files';
import { runPool } from '../../lib/recruiter/pool';
import UsageMeter from './UsageMeter';
import { blockedState, card, field, fill, formatDate, primaryButton, quietButton } from './shared';

const TOP = 5;
const MAX_REQUIREMENTS = 20;
const PARALLEL_EVALUATIONS = 3;

type UploadError = CandidateFileError | 'limit' | 'full' | 'failed';
type UploadState = 'waiting' | 'reading' | 'evaluating' | 'done' | 'duplicate' | 'error';
interface Upload {
  key: string;
  name: string;
  state: UploadState;
  error?: UploadError;
}

/** Best first; ties keep the order they arrived in, as the server does. */
export function withRanks(candidates: Candidate[]): Candidate[] {
  return [...candidates]
    .sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at))
    .map((candidate, index) => ({ ...candidate, rank: index + 1, top: index < TOP }));
}

// ── Criteria ─────────────────────────────────────────────────────────────────

function Rubric({
  t,
  screening,
  onSave,
}: {
  t: Translation;
  screening: Screening;
  onSave: (rubric: Requirement[]) => Promise<boolean>;
}) {
  const text = t.recruiter.screening;
  const [rows, setRows] = useState<Requirement[]>(screening.rubric);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (screening.rubric_locked) {
    return (
      <section className={card} data-testid="rubric">
        <h2 className="mb-1 text-xl font-bold text-white">{text.rubricTitle}</h2>
        <p className="mb-4 text-sm text-slate-400">{text.rubricLocked}</p>
        <ul className="space-y-2 text-sm text-slate-200">
          {screening.rubric.map((requirement) => (
            <li key={requirement.id} className="flex gap-3">
              <KindBadge t={t} kind={requirement.kind} />
              <span>{requirement.text}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const change = (index: number, changes: Partial<Requirement>) => {
    setSaved(false);
    setRows((list) => list.map((row, at) => (at === index ? { ...row, ...changes } : row)));
  };
  const usable = rows.filter((row) => row.text.trim());

  const save = async () => {
    setBusy(true);
    setSaved(await onSave(usable));
    setBusy(false);
  };

  return (
    <section className={card} data-testid="rubric">
      <h2 className="mb-1 text-xl font-bold text-white">{text.rubricTitle}</h2>
      <p className="mb-4 text-sm text-slate-400">{text.rubricHint}</p>
      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li key={index} className="flex gap-2">
            <select
              className={`${field} w-40 shrink-0`}
              aria-label={`${text.must} / ${text.nice}`}
              value={row.kind}
              onChange={(event) =>
                change(index, { kind: event.target.value as Requirement['kind'] })
              }
            >
              <option value="must">{text.must}</option>
              <option value="nice">{text.nice}</option>
            </select>
            <input
              className={field}
              maxLength={300}
              placeholder={text.requirementPlaceholder}
              value={row.text}
              onChange={(event) => change(index, { text: event.target.value })}
            />
            <button
              type="button"
              className={quietButton}
              aria-label={text.removeRequirement}
              title={text.removeRequirement}
              onClick={() => {
                setSaved(false);
                setRows((list) => list.filter((_, at) => at !== index));
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={quietButton}
          disabled={rows.length >= MAX_REQUIREMENTS}
          onClick={() => {
            setSaved(false);
            setRows((list) => [...list, { id: '', text: '', kind: 'must' }]);
          }}
        >
          {text.addRequirement}
        </button>
        <button
          type="button"
          className={primaryButton}
          disabled={busy || usable.length === 0}
          onClick={save}
        >
          {text.saveRubric}
        </button>
        {saved && <span className="text-sm text-emerald-300">{text.rubricSaved}</span>}
      </div>
    </section>
  );
}

function KindBadge({ t, kind }: { t: Translation; kind: Requirement['kind'] }) {
  const text = t.recruiter.screening;
  return (
    <span
      className={`h-fit shrink-0 rounded px-2 py-0.5 text-xs font-bold ${
        kind === 'must' ? 'bg-violet-500/20 text-violet-200' : 'bg-slate-700 text-slate-300'
      }`}
    >
      {kind === 'must' ? text.must : text.nice}
    </span>
  );
}

// ── One candidate ────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  met: 'bg-emerald-500/20 text-emerald-200',
  partial: 'bg-amber-500/20 text-amber-200',
  missing: 'bg-slate-700 text-slate-300',
};

function CandidateDetail({
  t,
  candidate,
  onUpdate,
  onDelete,
}: {
  t: Translation;
  candidate: Candidate;
  onUpdate: (changes: { display_name?: string; note?: string }) => Promise<boolean>;
  onDelete: () => void;
}) {
  const text = t.recruiter.screening;
  const [name, setName] = useState(candidate.display_name);
  const [note, setNote] = useState(candidate.note);
  const [saved, setSaved] = useState(false);
  const contact = [
    ...(candidate.contact.emails || []),
    ...(candidate.contact.phones || []),
    ...(candidate.contact.links || []),
  ];
  const heading = 'mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase';

  const save = async () => {
    const changes: { display_name?: string; note?: string } = { note };
    if (name.trim() && name.trim() !== candidate.display_name) changes.display_name = name.trim();
    setSaved(await onUpdate(changes));
  };

  return (
    <div className="space-y-5 border-t border-slate-700 p-4" data-testid="candidate-detail">
      {candidate.flagged && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          ⚠ {text.flagged}
        </p>
      )}
      {candidate.result.summary && (
        <p className="text-sm leading-relaxed text-slate-200">{candidate.result.summary}</p>
      )}

      <div>
        <h4 className={heading}>{text.requirements}</h4>
        <ul className="space-y-3">
          {candidate.result.requirements.map((finding) => (
            <li key={finding.id} className="text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[finding.status]}`}
                >
                  {text.statuses[finding.status]}
                </span>
                <KindBadge t={t} kind={finding.kind} />
                <span className="text-slate-200">{finding.text}</span>
              </div>
              {finding.evidence && (
                <blockquote className="mt-1 border-l-2 border-slate-600 pl-3 text-slate-400 italic">
                  “{finding.evidence}”
                  {!finding.verified && (
                    <span className="mt-1 block text-xs text-amber-300 not-italic">
                      {text.unverified}
                    </span>
                  )}
                </blockquote>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {candidate.result.strengths.length > 0 && (
          <div>
            <h4 className={heading}>{text.strengths}</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
              {candidate.result.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {candidate.result.concerns.length > 0 && (
          <div>
            <h4 className={heading}>{text.concerns}</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
              {candidate.result.concerns.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h4 className={heading}>{text.contact}</h4>
        {/* Plain text on purpose: these come from the CV and are not ours to turn into links */}
        <p className="text-sm break-words text-slate-300">
          {contact.length ? contact.join(' · ') : text.noContact}
        </p>
        <p className="mt-1 text-xs text-slate-500">{candidate.file_name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <div>
          <label className={heading} htmlFor={`name-${candidate.id}`}>
            {text.rename}
          </label>
          <input
            id={`name-${candidate.id}`}
            className={field}
            maxLength={120}
            value={name}
            onChange={(event) => {
              setSaved(false);
              setName(event.target.value);
            }}
          />
        </div>
        <div>
          <label className={heading} htmlFor={`note-${candidate.id}`}>
            {text.note}
          </label>
          <textarea
            id={`note-${candidate.id}`}
            className={`${field} h-20 resize-y`}
            maxLength={2000}
            placeholder={text.notePlaceholder}
            value={note}
            onChange={(event) => {
              setSaved(false);
              setNote(event.target.value);
            }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={quietButton} onClick={save}>
          {text.saveNote}
        </button>
        {saved && <span className="text-sm text-emerald-300">{text.noteSaved}</span>}
        <button
          type="button"
          className={`${quietButton} ml-auto hover:border-red-400 hover:text-red-200`}
          onClick={onDelete}
        >
          {text.deleteCandidate}
        </button>
      </div>
    </div>
  );
}

// ── The screening ────────────────────────────────────────────────────────────

export default function ScreeningView({
  t,
  lang,
  id,
}: {
  t: Translation;
  lang: CVLang;
  id: string;
}) {
  const { getToken, isLoaded, userId } = useAuth();
  const text = t.recruiter.screening;
  const [screening, setScreening] = useState<Screening | null>(null);
  const [status, setStatus] = useState<RecruiterStatus | null>(null);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [working, setWorking] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const batch = useRef(0);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const [detail, plan] = await Promise.all([
        api.getScreening(id, token),
        api.recruiterStatus(token),
      ]);
      setScreening(detail);
      setStatus(plan);
    } catch {
      setError(t.recruiter.errors.load);
    }
  }, [getToken, id, t]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [isLoaded, userId, load]);

  const setUpload = (key: string, changes: Partial<Upload>) =>
    setUploads((list) => list.map((item) => (item.key === key ? { ...item, ...changes } : item)));

  const addFiles = async (files: File[]) => {
    if (!files.length || working || !screening) return;
    const run = ++batch.current;
    const queue = files.map((file, index) => ({ file, key: `${run}-${index}` }));
    setUploads(queue.map(({ file, key }) => ({ key, name: file.name, state: 'waiting' })));
    setWorking(true);
    setError('');
    let stopReason: UploadError = 'limit';

    await runPool(
      queue,
      async ({ file, key }) => {
        setUpload(key, { state: 'reading' });
        let cvText: string;
        try {
          cvText = await readCandidateFile(file);
        } catch (problem) {
          setUpload(key, {
            state: 'error',
            error: problem instanceof CandidateFileProblem ? problem.code : 'unreadable',
          });
          return;
        }
        setUpload(key, { state: 'evaluating' });
        try {
          const { candidate, duplicate } = await api.addCandidate(
            id,
            { file_name: file.name, text: cvText },
            await getToken()
          );
          setUpload(key, { state: duplicate ? 'duplicate' : 'done' });
          setScreening((current) =>
            current
              ? {
                  ...current,
                  rubric_locked: true,
                  ranking: withRanks([
                    ...current.ranking.filter((item) => item.id !== candidate.id),
                    candidate,
                  ]),
                }
              : current
          );
        } catch (problem) {
          // Out of allowance or room: the rest of the pile would fail the same way
          if (isApiError(problem, 403) || isApiError(problem, 409)) {
            stopReason = isApiError(problem, 403) ? 'limit' : 'full';
            setUpload(key, { state: 'error', error: stopReason });
            return false;
          }
          setUpload(key, { state: 'error', error: 'failed' });
        }
      },
      {
        concurrency: PARALLEL_EVALUATIONS,
        onSkipped: ({ key }) => setUpload(key, { state: 'error', error: stopReason }),
      }
    );

    setWorking(false);
    // The server's order and the allowance left are the truth
    await load();
  };

  const saveRubric = async (rubric: Requirement[]) => {
    try {
      setScreening(await api.updateScreening(id, { rubric }, await getToken()));
      return true;
    } catch {
      setError(t.recruiter.errors.failed);
      return false;
    }
  };

  const updateCandidate = async (
    candidate: Candidate,
    changes: { display_name?: string; note?: string }
  ) => {
    try {
      const updated = await api.updateCandidate(id, candidate.id, changes, await getToken());
      setScreening((current) =>
        current
          ? {
              ...current,
              ranking: current.ranking.map((item) => (item.id === updated.id ? updated : item)),
            }
          : current
      );
      return true;
    } catch {
      setError(t.recruiter.errors.failed);
      return false;
    }
  };

  const deleteCandidate = async (candidate: Candidate) => {
    if (!window.confirm(text.confirmDeleteCandidate)) return;
    try {
      await api.deleteCandidate(id, candidate.id, await getToken());
      await load();
    } catch {
      setError(t.recruiter.errors.failed);
    }
  };

  const exportCsv = () => {
    if (!screening) return;
    const name =
      screening.title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'ranking';
    downloadCsv(`${name}.csv`, rankingToCsv(screening, text.csv));
  };

  if (!screening) {
    return (
      <div className="mx-auto max-w-4xl" data-testid="screening">
        <a
          href={window.location.pathname}
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          ← {text.back}
        </a>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-200">
            {error}
          </p>
        )}
      </div>
    );
  }

  const blocked = blockedState(status);
  const finished = uploads.filter(
    (item) => !['waiting', 'reading', 'evaluating'].includes(item.state)
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6" data-testid="screening">
      <header>
        <a
          href={window.location.pathname}
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          ← {text.back}
        </a>
        <h1 className="mt-2 text-3xl font-bold text-white">{screening.title}</h1>
        <p className="mt-1 text-xs text-slate-400">
          {fill(t.recruiter.app.expires, { date: formatDate(screening.expires_at, lang) })}
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <Rubric
        key={screening.rubric_locked ? 'locked' : 'open'}
        t={t}
        screening={screening}
        onSave={saveRubric}
      />

      <section className={card}>
        <h2 className="mb-4 text-xl font-bold text-white">{text.uploadTitle}</h2>
        {status && (
          <div className="mb-4">
            <UsageMeter t={t} lang={lang} status={status} />
          </div>
        )}
        {blocked ? (
          <p
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100"
            data-testid="recruiter-blocked"
          >
            {t.recruiter.app.states[blocked]}{' '}
            <a href={window.location.pathname} className="font-bold underline">
              {t.recruiter.app.seePlans}
            </a>
          </p>
        ) : (
          <>
            <button
              type="button"
              disabled={working}
              data-testid="cv-dropzone"
              className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition-colors disabled:opacity-50 ${
                dragging
                  ? 'border-violet-400 bg-violet-500/10'
                  : 'border-slate-600 hover:border-violet-400'
              }`}
              onClick={() => picker.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles([...event.dataTransfer.files]);
              }}
            >
              <span className="block font-bold text-white">{text.dropzone}</span>
              <span className="mt-1 block text-sm text-slate-400">{text.formats}</span>
            </button>
            <input
              ref={picker}
              type="file"
              multiple
              hidden
              accept={ACCEPTED_CV_FILES}
              data-testid="cv-files"
              onChange={(event) => {
                addFiles([...(event.target.files || [])]);
                event.target.value = '';
              }}
            />
            <p className="mt-3 text-xs text-slate-500">{text.privacy}</p>
          </>
        )}

        {uploads.length > 0 && (
          <div className="mt-5" data-testid="uploads">
            <p className="mb-2 text-sm font-bold text-slate-200" aria-live="polite">
              {fill(text.progress, { done: finished.length, total: uploads.length })}
            </p>
            <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
              {uploads.map((item) => (
                <li key={item.key} className="flex justify-between gap-3" data-state={item.state}>
                  <span className="truncate text-slate-300">{item.name}</span>
                  <span
                    className={`shrink-0 text-right ${
                      item.state === 'error'
                        ? 'text-red-300'
                        : item.state === 'done'
                          ? 'text-emerald-300'
                          : 'text-slate-400'
                    }`}
                  >
                    {item.state === 'error'
                      ? t.recruiter.errors[item.error || 'failed']
                      : text.fileStates[item.state]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">{text.rankingTitle}</h2>
          {screening.ranking.length > 0 && (
            <button type="button" className={quietButton} onClick={exportCsv}>
              {text.export}
            </button>
          )}
        </div>
        {screening.ranking.length === 0 ? (
          <p className="text-sm text-slate-400" data-testid="empty-ranking">
            {text.emptyRanking}
          </p>
        ) : (
          <>
            <ol className="space-y-2" data-testid="ranking">
              {screening.ranking.map((candidate) => (
                <li
                  key={candidate.id}
                  data-testid="candidate"
                  className={`rounded-xl border ${
                    candidate.top ? 'border-violet-500/60 bg-violet-500/5' : 'border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3 p-4">
                    <span className="w-8 text-lg font-bold text-slate-400">{candidate.rank}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">
                        {candidate.display_name}
                        {candidate.top && (
                          <span className="ml-2 rounded bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                            {text.top}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-400">
                        {candidate.missing_musts > 0 && (
                          <span>{fill(text.missingMusts, { n: candidate.missing_musts })}</span>
                        )}
                        {candidate.flagged && (
                          <span className="font-bold text-amber-300">⚠ {text.flaggedShort}</span>
                        )}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-white" title={text.score}>
                      {candidate.score}
                    </span>
                    <button
                      type="button"
                      className={quietButton}
                      aria-expanded={open === candidate.id}
                      onClick={() => setOpen(open === candidate.id ? null : candidate.id)}
                    >
                      {open === candidate.id ? text.hide : text.details}
                    </button>
                  </div>
                  {open === candidate.id && (
                    <CandidateDetail
                      t={t}
                      candidate={candidate}
                      onUpdate={(changes) => updateCandidate(candidate, changes)}
                      onDelete={() => deleteCandidate(candidate)}
                    />
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-slate-500">{text.disclaimer}</p>
          </>
        )}
      </section>
    </div>
  );
}
