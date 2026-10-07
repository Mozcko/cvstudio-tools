// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { locales } from '../../../i18n/locales';
import { api, ApiError } from '../../../lib/api';
import { CandidateFileProblem, readCandidateFile } from '../../../lib/recruiter/files';
import { downloadCsv } from '../../../lib/recruiter/csv';
import ScreeningView, { withRanks } from '../ScreeningView';
import { candidate, screening, trial } from './fixtures';

const auth = vi.hoisted(() => ({
  userId: 'user_1',
  isLoaded: true,
  getToken: async () => 'token',
}));
vi.mock('@clerk/astro/react', () => ({ useAuth: () => auth }));
vi.mock('../../../lib/recruiter/files', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/recruiter/files')>()),
  readCandidateFile: vi.fn(),
}));
vi.mock('../../../lib/recruiter/csv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/recruiter/csv')>()),
  downloadCsv: vi.fn(),
}));
vi.mock('../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/api')>();
  return {
    ...actual,
    api: {
      recruiterStatus: vi.fn(),
      getScreening: vi.fn(),
      updateScreening: vi.fn(),
      addCandidate: vi.fn(),
      updateCandidate: vi.fn(),
      deleteCandidate: vi.fn(),
    },
  };
});

const mocked = vi.mocked(api);
const read = vi.mocked(readCandidateFile);
const t = locales.es;
const text = t.recruiter.screening;

const file = (name: string) => new File(['cv'], name, { type: 'application/pdf' });
const show = () => render(<ScreeningView t={t} lang="es" id="s1" />);
const choose = (...names: string[]) =>
  fireEvent.change(screen.getByTestId('cv-files'), { target: { files: names.map(file) } });
const states = () =>
  within(screen.getByTestId('uploads'))
    .getAllByRole('listitem')
    .map((item) => item.getAttribute('data-state'));

beforeEach(() => {
  vi.clearAllMocks();
  mocked.recruiterStatus.mockResolvedValue(trial());
  mocked.getScreening.mockResolvedValue(screening());
  read.mockResolvedValue('The text of a CV');
  vi.stubGlobal('location', { pathname: '/app/recruiter', search: '?id=s1' });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('withRanks', () => {
  it('orders by score, earliest first on ties, and marks the first five', () => {
    const ranked = withRanks([
      candidate('a', 50),
      candidate('bbb', 90),
      candidate('cc', 90),
      ...['d', 'e', 'f', 'g'].map((id) => candidate(id, 10)),
    ]);
    expect(ranked.slice(0, 3).map((item) => item.id)).toEqual(['cc', 'bbb', 'a']);
    expect(ranked.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(ranked.filter((item) => item.top)).toHaveLength(5);
  });
});

describe('ScreeningView', () => {
  it('shows an editable rubric and an empty ranking', async () => {
    show();
    expect(await screen.findByRole('heading', { name: 'Backend engineer' })).toBeTruthy();
    expect(screen.getByDisplayValue('Python')).toBeTruthy();
    expect(screen.getByTestId('empty-ranking')).toBeTruthy();
    expect(screen.getByText(text.privacy)).toBeTruthy();
  });

  it('saves an edited rubric without its blank lines', async () => {
    mocked.updateScreening.mockResolvedValue(screening());
    show();
    fireEvent.change(await screen.findByDisplayValue('Docker'), {
      target: { value: 'Kubernetes' },
    });
    fireEvent.click(screen.getByRole('button', { name: text.addRequirement }));
    fireEvent.click(screen.getAllByRole('button', { name: text.removeRequirement })[0]);
    fireEvent.click(screen.getByRole('button', { name: text.saveRubric }));

    expect(await screen.findByText(text.rubricSaved)).toBeTruthy();
    expect(mocked.updateScreening).toHaveBeenCalledWith(
      's1',
      { rubric: [{ id: 'r2', text: 'Kubernetes', kind: 'nice' }] },
      'token'
    );
  });

  it('evaluates the chosen files, ranks them as they arrive and locks the rubric', async () => {
    mocked.addCandidate
      .mockResolvedValueOnce({ candidate: candidate('low', 40), duplicate: false })
      .mockResolvedValueOnce({ candidate: candidate('high', 90), duplicate: false })
      .mockResolvedValueOnce({ candidate: candidate('high', 90), duplicate: true });
    mocked.getScreening.mockResolvedValueOnce(screening()).mockResolvedValue(
      screening({
        rubric_locked: true,
        ranking: withRanks([candidate('low', 40), candidate('high', 90)]),
      })
    );
    show();
    await screen.findByTestId('cv-dropzone');
    choose('low.pdf', 'high.pdf', 'again.pdf');

    await waitFor(() => expect(states()).toEqual(['done', 'done', 'duplicate']));
    expect(screen.getByText('3 de 3 procesados')).toBeTruthy();
    const names = screen
      .getAllByTestId('candidate')
      .map((row) => row.querySelector('p')?.textContent);
    expect(names[0]).toContain('Candidate high');
    expect(names[1]).toContain('Candidate low');
    expect(mocked.addCandidate).toHaveBeenCalledWith(
      's1',
      { file_name: 'low.pdf', text: 'The text of a CV' },
      'token'
    );
    // Only the text travels, and the rubric can no longer be edited
    await waitFor(() => expect(screen.getByText(text.rubricLocked)).toBeTruthy());
    expect(screen.queryByRole('button', { name: text.saveRubric })).toBeNull();
  });

  it('explains files that cannot be read and failed evaluations, and carries on', async () => {
    read
      .mockRejectedValueOnce(new CandidateFileProblem('legacyDoc'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue('The text of a CV');
    mocked.addCandidate
      .mockRejectedValueOnce(new ApiError('provider down', 502))
      .mockResolvedValueOnce({ candidate: candidate('ok', 70), duplicate: false });
    show();
    await screen.findByTestId('cv-dropzone');
    choose('old.doc', 'broken.pdf', 'unlucky.pdf', 'fine.pdf');

    await waitFor(() => expect(states()).toEqual(['error', 'error', 'error', 'done']));
    const list = screen.getByTestId('uploads');
    expect(within(list).getByText(t.recruiter.errors.legacyDoc)).toBeTruthy();
    expect(within(list).getByText(t.recruiter.errors.unreadable)).toBeTruthy();
    expect(within(list).getByText(t.recruiter.errors.failed)).toBeTruthy();
    expect(mocked.addCandidate).toHaveBeenCalledTimes(2);
  });

  it('stops the pile when the allowance runs out', async () => {
    mocked.addCandidate.mockRejectedValue(new ApiError('trial used', 403));
    mocked.recruiterStatus
      .mockResolvedValueOnce(trial())
      .mockResolvedValue(trial({ can_evaluate: false, used: 10, remaining: 0 }));
    show();
    await screen.findByTestId('cv-dropzone');
    choose('1.pdf', '2.pdf', '3.pdf', '4.pdf', '5.pdf', '6.pdf', '7.pdf');

    await waitFor(() => expect(screen.getByTestId('recruiter-blocked')).toBeTruthy());
    expect(states()).toEqual(Array(7).fill('error'));
    expect(
      within(screen.getByTestId('uploads')).getAllByText(t.recruiter.errors.limit)
    ).toHaveLength(7);
    // The three in flight failed; the other four were never sent
    expect(mocked.addCandidate.mock.calls.length).toBeLessThanOrEqual(3);
    expect(screen.queryByTestId('cv-dropzone')).toBeNull();
  });

  it('says a full screening is full', async () => {
    mocked.addCandidate.mockRejectedValue(new ApiError('full', 409));
    show();
    await screen.findByTestId('cv-dropzone');
    choose('1.pdf');
    await waitFor(() => expect(states()).toEqual(['error']));
    expect(screen.getByText(t.recruiter.errors.full)).toBeTruthy();
  });

  it('accepts dropped files', async () => {
    mocked.addCandidate.mockResolvedValue({ candidate: candidate('a', 60), duplicate: false });
    show();
    const zone = await screen.findByTestId('cv-dropzone');
    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [file('a.pdf')] } });
    await waitFor(() => expect(mocked.addCandidate).toHaveBeenCalledTimes(1));
  });

  describe('with a ranking', () => {
    const flagged = candidate('zed', 95, {
      flagged: true,
      missing_musts: 1,
      contact: {},
      result: {
        requirements: [
          {
            id: 'r1',
            text: 'Python',
            kind: 'must',
            status: 'partial',
            evidence: 'I know it all',
            verified: false,
          },
          {
            id: 'r2',
            text: 'Docker',
            kind: 'nice',
            status: 'missing',
            evidence: '',
            verified: false,
          },
        ],
        strengths: [],
        concerns: ['Claims without detail'],
        summary: '',
      },
    });

    beforeEach(() => {
      mocked.getScreening.mockResolvedValue(
        screening({ rubric_locked: true, ranking: withRanks([candidate('ada', 80), flagged]) })
      );
    });

    it('shows the evidence, warnings and contact details of a candidate', async () => {
      show();
      const rows = await screen.findAllByTestId('candidate');
      expect(within(rows[0]).getByText(`⚠ ${text.flaggedShort}`)).toBeTruthy();
      expect(within(rows[0]).getByText('1 imprescindibles sin demostrar')).toBeTruthy();

      fireEvent.click(within(rows[0]).getByRole('button', { name: text.details }));
      const detail = within(screen.getByTestId('candidate-detail'));
      expect(detail.getByText(`⚠ ${text.flagged}`)).toBeTruthy();
      expect(detail.getByText(text.unverified)).toBeTruthy();
      expect(detail.getByText(text.statuses.partial)).toBeTruthy();
      expect(detail.getByText(text.statuses.missing)).toBeTruthy();
      expect(detail.getByText(text.noContact)).toBeTruthy();
      expect(detail.getByText('Claims without detail')).toBeTruthy();

      // Opening another closes this one
      fireEvent.click(within(rows[1]).getByRole('button', { name: text.details }));
      const other = within(screen.getByTestId('candidate-detail'));
      expect(other.getByText('ada@example.com')).toBeTruthy();
      expect(other.getByText('“Built services in Python”')).toBeTruthy();
      fireEvent.click(within(rows[1]).getByRole('button', { name: text.hide }));
      expect(screen.queryByTestId('candidate-detail')).toBeNull();
    });

    it('saves a note and a new name', async () => {
      mocked.updateCandidate.mockResolvedValue(
        candidate('ada', 80, { display_name: 'Ada L.', note: 'Call her', rank: 2, top: true })
      );
      show();
      const rows = await screen.findAllByTestId('candidate');
      fireEvent.click(within(rows[1]).getByRole('button', { name: text.details }));
      fireEvent.change(screen.getByLabelText(text.rename), { target: { value: 'Ada L.' } });
      fireEvent.change(screen.getByLabelText(text.note), { target: { value: 'Call her' } });
      fireEvent.click(screen.getByRole('button', { name: text.saveNote }));

      expect(await screen.findByText(text.noteSaved)).toBeTruthy();
      expect(mocked.updateCandidate).toHaveBeenCalledWith(
        's1',
        'ada',
        { note: 'Call her', display_name: 'Ada L.' },
        'token'
      );
      expect(screen.getAllByTestId('candidate')[1].textContent).toContain('Ada L.');
    });

    it('reports a note that could not be saved', async () => {
      mocked.updateCandidate.mockRejectedValue(new ApiError('down', 500));
      show();
      const rows = await screen.findAllByTestId('candidate');
      fireEvent.click(within(rows[1]).getByRole('button', { name: text.details }));
      fireEvent.click(screen.getByRole('button', { name: text.saveNote }));
      expect((await screen.findByRole('alert')).textContent).toBe(t.recruiter.errors.failed);
      // Unchanged name is not sent
      expect(mocked.updateCandidate).toHaveBeenCalledWith('s1', 'ada', { note: '' }, 'token');
    });

    it('deletes a candidate after confirming', async () => {
      mocked.deleteCandidate.mockResolvedValue(undefined as never);
      const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
      vi.stubGlobal('confirm', confirm);
      show();
      const rows = await screen.findAllByTestId('candidate');
      fireEvent.click(within(rows[1]).getByRole('button', { name: text.details }));
      const remove = screen.getByRole('button', { name: text.deleteCandidate });

      fireEvent.click(remove);
      expect(mocked.deleteCandidate).not.toHaveBeenCalled();
      mocked.getScreening.mockResolvedValue(
        screening({ rubric_locked: true, ranking: withRanks([flagged]) })
      );
      fireEvent.click(remove);

      await waitFor(() => expect(screen.getAllByTestId('candidate')).toHaveLength(1));
      expect(mocked.deleteCandidate).toHaveBeenCalledWith('s1', 'ada', 'token');
    });

    it('exports the ranking as a CSV named after the screening', async () => {
      show();
      fireEvent.click(await screen.findByRole('button', { name: text.export }));
      expect(downloadCsv).toHaveBeenCalledWith(
        'Backend-engineer.csv',
        expect.stringContaining('Candidate zed')
      );
    });
  });

  it('a screening that cannot be loaded offers the way back', async () => {
    mocked.getScreening.mockRejectedValue(new ApiError('Screening not found', 404));
    show();
    expect((await screen.findByRole('alert')).textContent).toBe(t.recruiter.errors.load);
    expect(screen.getByRole('link', { name: `← ${text.back}` }).getAttribute('href')).toBe(
      '/app/recruiter'
    );
  });
});
