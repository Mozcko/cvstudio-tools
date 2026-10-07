import type { Candidate, RecruiterStatus, Screening } from '../../../lib/api';

export const trial = (changes: Partial<RecruiterStatus> = {}): RecruiterStatus => ({
  plan: 'trial',
  status: 'trial',
  can_evaluate: true,
  used: 2,
  limit: 10,
  remaining: 8,
  period_end: null,
  retention_days: 90,
  reason: null,
  has_billing: false,
  ...changes,
});

export const candidate = (
  id: string,
  score: number,
  changes: Partial<Candidate> = {}
): Candidate => ({
  id,
  rank: 1,
  top: true,
  display_name: `Candidate ${id}`,
  file_name: `${id}.pdf`,
  contact: { emails: [`${id}@example.com`], phones: [], links: [] },
  score,
  missing_musts: 0,
  flagged: false,
  result: {
    requirements: [
      {
        id: 'r1',
        text: 'Python',
        kind: 'must',
        status: 'met',
        evidence: 'Built services in Python',
        verified: true,
      },
    ],
    strengths: ['Solid backend experience'],
    concerns: [],
    summary: `Summary of ${id}`,
  },
  note: '',
  created_at: `2026-10-01T00:00:0${id.length}Z`,
  ...changes,
});

export const screening = (changes: Partial<Screening> = {}): Screening => ({
  id: 's1',
  title: 'Backend engineer',
  language: 'es',
  candidates: 0,
  top_score: null,
  created_at: '2026-10-01T00:00:00Z',
  expires_at: '2026-12-30T00:00:00Z',
  job_description: 'A long enough job description for a backend engineer role.',
  rubric: [
    { id: 'r1', text: 'Python', kind: 'must' },
    { id: 'r2', text: 'Docker', kind: 'nice' },
  ],
  rubric_locked: false,
  ranking: [],
  ...changes,
});
