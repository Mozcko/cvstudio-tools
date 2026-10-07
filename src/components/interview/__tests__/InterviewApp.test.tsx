// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { locales } from '../../../i18n/locales';
import { api, type InterviewSession } from '../../../lib/api';
import { initialCVData } from '../../../types/cv';
import InterviewApp from '../InterviewApp';

const plan = vi.hoisted(() => ({
  isPro: true,
  isPremium: true,
  plan: 'active',
  loading: false,
  usage: {
    free_ai: { limit: 3, remaining: 3, resets_at: null },
    free_imports: { limit: 2, remaining: 2, resets_at: null },
    interviews_daily: { limit: 3, remaining: 2, resets_at: null },
    interviews_monthly: { limit: 30, remaining: 29, resets_at: null },
  },
}));

// Clerk hands out the same getToken on every render; the fake must too
const auth = vi.hoisted(() => ({
  userId: 'user_1',
  isLoaded: true,
  getToken: async () => 'token',
}));
vi.mock('@clerk/astro/react', () => ({ useAuth: () => auth }));
vi.mock('../../../hooks/useProStatus', () => ({ default: () => plan }));
vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/api')>();
  return {
    ...actual,
    api: {
      getCVs: vi.fn(),
      listInterviews: vi.fn(),
      startInterview: vi.fn(),
      answerInterviewText: vi.fn(),
      getInterviewAudio: vi.fn(),
      finishInterview: vi.fn(),
      getInterview: vi.fn(),
      deleteInterview: vi.fn(),
    },
  };
});

const mocked = vi.mocked(api);
const t = locales.es.interview;

const cv = (id: string, title: string, content: unknown = initialCVData) => ({
  id,
  title,
  content,
  language: 'ES',
  theme: null,
  updated_at: '2026-10-01T00:00:00Z',
});

const live = (): InterviewSession => ({
  id: 'int-1',
  title: 'Ingeniera Python',
  language: 'es',
  status: 'active',
  question_count: 4,
  overall_score: null,
  created_at: '2026-10-07T10:00:00Z',
  completed_at: null,
  current_question: 0,
  done: false,
  questions: ['¿Puedes presentarte?'],
  turns: [
    {
      index: 0,
      role: 'recruiter',
      kind: 'question',
      question: 0,
      text: 'Hola Ada, gracias por tu tiempo. ¿Puedes presentarte?',
      at: '2026-10-07T10:00:00Z',
    },
  ],
  report: null,
});

const finished = (): InterviewSession => ({
  ...live(),
  status: 'completed',
  done: true,
  current_question: 4,
  overall_score: 82,
  completed_at: '2026-10-07T10:20:00Z',
  turns: [
    ...live().turns,
    {
      index: 1,
      role: 'candidate',
      kind: 'answer',
      question: 0,
      text: 'Soy Ada.',
      at: '2026-10-07T10:01:00Z',
    },
  ],
  report: {
    overall_score: 82,
    summary: 'Respuestas claras y concretas.',
    strengths: ['Claridad'],
    improvements: ['Más cifras'],
    tips: ['Practica el cierre'],
    answers: [
      {
        question: 0,
        score: 8,
        went_well: 'Directa.',
        improve: 'Añade un logro.',
        sample_answer: 'Soy Ada, ingeniera con cinco años de experiencia.',
      },
    ],
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  plan.isPremium = true;
  plan.loading = false;
  window.history.replaceState(null, '', '/app/interview');
  mocked.getCVs.mockResolvedValue([cv('cv-1', 'CV Backend'), cv('cv-2', 'CV Datos')] as never);
  mocked.listInterviews.mockResolvedValue([]);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('InterviewApp', () => {
  it('shows the upgrade screen to plans without interviews, and asks the server for nothing', async () => {
    plan.isPremium = false;
    render(<InterviewApp lang="es" />);

    expect(screen.getByTestId('interview-upsell')).toBeTruthy();
    expect(screen.getByRole('link', { name: t.upsell.action }).getAttribute('href')).toBe(
      '/pricing'
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mocked.getCVs).not.toHaveBeenCalled();
    expect(mocked.listInterviews).not.toHaveBeenCalled();
  });

  it('sets up an interview: CV from the link, start only with a real job posting', async () => {
    window.history.replaceState(null, '', '/app/interview?cv=cv-2');
    render(<InterviewApp lang="es" />);

    const select = (await screen.findByLabelText(t.setup.cv)) as HTMLSelectElement;
    expect(select.value).toBe('cv-2');
    expect(screen.getByText(t.setup.remaining.replace('{n}', '2'))).toBeTruthy();
    expect(screen.getByText(t.history.empty)).toBeTruthy();

    const start = screen.getByTestId('interview-start') as HTMLButtonElement;
    expect(start.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(t.setup.job), { target: { value: 'corta' } });
    expect(start.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(t.setup.job), {
      target: { value: 'Ingeniera Python para un equipo de pagos, Django y PostgreSQL.' },
    });
    expect(start.disabled).toBe(false);
  });

  it('cannot use a CV saved in Markdown mode, and says so when there is no CV at all', async () => {
    mocked.getCVs.mockResolvedValue([
      cv('md', 'Solo Markdown', { mode: 'markdown', markdown: '# x' }),
      cv('ok', 'Normal'),
    ] as never);
    const first = render(<InterviewApp lang="es" />);
    const select = (await screen.findByLabelText(t.setup.cv)) as HTMLSelectElement;
    expect(select.value).toBe('ok');
    expect((select.querySelector('option[value="md"]') as HTMLOptionElement).disabled).toBe(true);
    first.unmount();

    mocked.getCVs.mockResolvedValue([]);
    render(<InterviewApp lang="es" />);
    expect(await screen.findByText(t.setup.noCvs)).toBeTruthy();
  });

  it('runs a typed interview through to the report', async () => {
    mocked.startInterview.mockResolvedValue(live());
    // No audio in this environment: the interview continues in text
    mocked.getInterviewAudio.mockRejectedValue(new Error('no audio'));
    mocked.answerInterviewText.mockResolvedValue({
      answer: finished().turns[1],
      reply: {
        index: 2,
        role: 'recruiter',
        kind: 'closing',
        question: 0,
        text: 'Gracias. Eso es todo por mi parte.',
        at: '2026-10-07T10:02:00Z',
      },
      current_question: 4,
      done: true,
    });
    mocked.finishInterview.mockResolvedValue(finished());
    render(<InterviewApp lang="es" />);

    fireEvent.change(await screen.findByLabelText(t.setup.job), {
      target: { value: 'Ingeniera Python para un equipo de pagos, Django y PostgreSQL.' },
    });
    fireEvent.click(screen.getByTestId('interview-start'));

    expect(await screen.findByText(/¿Puedes presentarte\?/)).toBeTruthy();
    expect(
      screen.getByText(t.room.progress.replace('{n}', '1').replace('{total}', '4'))
    ).toBeTruthy();
    expect(mocked.startInterview.mock.calls[0][0]).toMatchObject({
      language: 'es',
      question_count: 6,
    });

    // jsdom has no microphone, so the typed answer box is shown
    fireEvent.change(await screen.findByTestId('interview-text'), {
      target: { value: 'Soy Ada.' },
    });
    fireEvent.click(screen.getByRole('button', { name: t.room.send }));

    expect(await screen.findByTestId('interview-report')).toBeTruthy();
    expect(mocked.answerInterviewText).toHaveBeenCalledWith('int-1', 'Soy Ada.', 'token');
    expect(screen.getByText('82')).toBeTruthy();
    expect(screen.getByText('Respuestas claras y concretas.')).toBeTruthy();
    expect(screen.getByText('8/10')).toBeTruthy();
    expect(screen.getByText('Soy Ada, ingeniera con cinco años de experiencia.')).toBeTruthy();
    expect(screen.getByText('Soy Ada.')).toBeTruthy();
  });

  it('lists past interviews, opens one and deletes one', async () => {
    mocked.listInterviews.mockResolvedValue([
      { ...finished(), id: 'int-1' },
      { ...live(), id: 'int-2', title: '' },
    ]);
    mocked.getInterview.mockResolvedValue(finished());
    mocked.deleteInterview.mockResolvedValue(undefined as never);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<InterviewApp lang="es" />);

    expect(await screen.findByText('Ingeniera Python')).toBeTruthy();
    expect(screen.getByText(t.history.untitled)).toBeTruthy();
    expect(screen.getByText(new RegExp(t.history.inProgress))).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: t.history.delete })[1]);
    await waitFor(() => expect(mocked.deleteInterview).toHaveBeenCalledWith('int-2', 'token'));
    await waitFor(() => expect(screen.queryByText(t.history.untitled)).toBeNull());

    fireEvent.click(screen.getAllByRole('button', { name: t.history.open })[0]);
    expect(await screen.findByTestId('interview-report')).toBeTruthy();
  });

  it('renders in English and Portuguese', async () => {
    const english = render(<InterviewApp lang="en" />);
    expect(await screen.findByText(locales.en.interview.title)).toBeTruthy();
    expect(await screen.findByLabelText(locales.en.interview.setup.job)).toBeTruthy();
    english.unmount();

    render(<InterviewApp lang="pt" />);
    expect(await screen.findByLabelText(locales.pt.interview.setup.job)).toBeTruthy();
  });
});
