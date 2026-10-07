// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { locales } from '../../../../../i18n/locales';
import { ApiError, api } from '../../../../../lib/api';
import { readDraft, writeDraft, type CVDraft } from '../../../../../lib/cvDraft';
import { initialCVData, type CVData } from '../../../../../types/cv';
import { useCVLogic } from '../useCVLogic';

// ── Test doubles ────────────────────────────────────────────────────────────

const auth = vi.hoisted(() => ({
  userId: 'user_1' as string | null,
  isLoaded: true,
  getToken: async () => 'token',
}));

vi.mock('@clerk/astro/react', () => ({ useAuth: () => auth }));

vi.mock('../../../../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../lib/api')>();
  return {
    ...actual,
    api: {
      getUserProfile: vi.fn(),
      getCV: vi.fn(),
      createCV: vi.fn(),
      updateCV: vi.fn(),
      rewriteCV: vi.fn(),
      simulateATS: vi.fn(),
      generateCoverLetter: vi.fn(),
    },
  };
});

const mocked = vi.mocked(api);
const t = locales.es;

const record = (overrides: Record<string, unknown> = {}) => ({
  id: 'cv-1',
  title: 'Server title',
  content: { ...initialCVData, personal: { ...initialCVData.personal, name: 'From Server' } },
  language: 'EN',
  theme: 'modern',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const draft = (overrides: Partial<CVDraft> = {}): CVDraft => ({
  data: { ...initialCVData, personal: { ...initialCVData.personal, name: 'Local Draft' } },
  themeId: 'minimal',
  title: 'Local title',
  mode: 'form',
  markdown: '',
  dirty: true,
  updatedAt: 1,
  ...overrides,
});

const withName = (data: CVData, name: string): CVData => ({
  ...data,
  personal: { ...data.personal, name },
});

const setUrl = (search = '') => window.history.replaceState(null, '', `/app/editor${search}`);

/** Renders the hook and waits until its initial load has finished. */
const setup = async () => {
  const view = renderHook(() => useCVLogic(t, 'es'));
  await waitFor(() => expect(view.result.current.isInitializing).toBe(false));
  // Let the Pro-status request settle
  await act(async () => {});
  return view;
};

beforeEach(() => {
  localStorage.clear();
  setUrl();
  auth.userId = 'user_1';
  auth.isLoaded = true;
  vi.clearAllMocks();
  mocked.getUserProfile.mockResolvedValue({ id: 'user_1', is_pro: false, pro_expires_at: null });
  mocked.createCV.mockResolvedValue(record({ id: 'new-id' }) as never);
  mocked.updateCV.mockResolvedValue(record() as never);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ── Loading ─────────────────────────────────────────────────────────────────

describe('loading', () => {
  it('starts from the sample CV when there is no id and no draft', async () => {
    const { result } = await setup();

    expect(result.current.cvData.personal.name).toBe(initialCVData.personal.name);
    expect(result.current.resumeId).toBeNull();
    expect(result.current.isDirty).toBe(false);
    expect(mocked.getCV).not.toHaveBeenCalled();
  });

  it('restores the unsaved draft when there is no id', async () => {
    writeDraft(null, draft());

    const { result } = await setup();

    expect(result.current.cvData.personal.name).toBe('Local Draft');
    expect(result.current.activeThemeId).toBe('minimal');
    expect(result.current.isDirty).toBe(true);
  });

  it('loads the server copy for ?id= when the local draft is clean', async () => {
    setUrl('?id=cv-1');
    writeDraft('cv-1', draft({ dirty: false }));
    mocked.getCV.mockResolvedValue(record() as never);

    const { result } = await setup();

    expect(result.current.cvData.personal.name).toBe('From Server');
    expect(result.current.activeThemeId).toBe('modern');
    expect(result.current.resumeTitle).toBe('Server title');
    expect(result.current.cvData.language).toBe('EN');
    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.shouldAutosave).toBe(false);
  });

  it('keeps a dirty local draft over the server copy, and autosaves it', async () => {
    setUrl('?id=cv-1');
    writeDraft('cv-1', draft());
    mocked.getCV.mockResolvedValue(record() as never);

    const { result } = await setup();

    expect(result.current.cvData.personal.name).toBe('Local Draft');
    expect(result.current.isDirty).toBe(true);
    expect(result.current.shouldAutosave).toBe(true);
  });

  it('opens Markdown-mode CVs in the code editor', async () => {
    setUrl('?id=cv-1');
    mocked.getCV.mockResolvedValue(
      record({ content: { mode: 'markdown', markdown: '# Jane\n\nHello' } }) as never
    );

    const { result } = await setup();

    expect(result.current.editMode).toBe('code');
    expect(result.current.markdown).toBe('# Jane\n\nHello');
  });

  it('falls back to a new draft when the id is unknown', async () => {
    setUrl('?id=gone');
    writeDraft('gone', draft({ dirty: false }));
    mocked.getCV.mockRejectedValue(new ApiError('CV not found', 404));

    const { result } = await setup();

    expect(result.current.resumeId).toBeNull();
    expect(window.location.search).toBe('');
    expect(readDraft('gone')).toBeNull();
    expect(result.current.toasts.at(-1)?.message).toBe(t.messages.notFound);
  });

  it('does not hang for a signed-out visitor with ?id= and asks them to sign in', async () => {
    auth.userId = null;
    setUrl('?id=cv-1');

    const { result } = await setup();

    expect(result.current.isGuest).toBe(true);
    expect(result.current.isAuthModalOpen).toBe(true);
    expect(mocked.getCV).not.toHaveBeenCalled();
  });

  it('nobody is a guest while Clerk is still loading', async () => {
    auth.isLoaded = false;
    auth.userId = null;

    const { result } = renderHook(() => useCVLogic(t, 'es'));

    expect(result.current.isGuest).toBe(false);
  });
});

// ── Drafts ──────────────────────────────────────────────────────────────────

describe('local draft', () => {
  it('is written under the CV id, and guests always use the "new" slot', async () => {
    setUrl('?id=cv-1');
    mocked.getCV.mockResolvedValue(record() as never);
    const { result } = await setup();

    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Edited')));

    await waitFor(() => expect(readDraft('cv-1')?.data.personal.name).toBe('Edited'));
    expect(readDraft('cv-1')?.dirty).toBe(true);
    expect(readDraft('cv-1')?.themeId).toBe('modern');
    expect(readDraft(null)).toBeNull();
  });

  it('a guest edit lands in the "new" draft', async () => {
    auth.userId = null;
    const { result } = await setup();

    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Guest')));

    await waitFor(() => expect(readDraft(null)?.data.personal.name).toBe('Guest'));
  });
});

// ── Saving ──────────────────────────────────────────────────────────────────

describe('saving', () => {
  it('guests are asked to sign in instead', async () => {
    auth.userId = null;
    const { result } = await setup();

    await act(() => result.current.handleSave());

    expect(result.current.isAuthModalOpen).toBe(true);
    expect(mocked.createCV).not.toHaveBeenCalled();
  });

  it('creates the CV on first save, with its theme, and moves the draft to the new id', async () => {
    const { result } = await setup();
    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Jane')));
    act(() =>
      result.current.handleThemeChange({ id: 'minimal', name: 'Minimal', css: '', color: '' })
    );

    await act(() => result.current.handleSave());

    expect(mocked.createCV).toHaveBeenCalledTimes(1);
    const body = mocked.createCV.mock.calls[0][0];
    expect(body.theme).toBe('minimal');
    expect((body.content as CVData).personal.name).toBe('Jane');
    expect(body).not.toHaveProperty('id');
    expect(result.current.resumeId).toBe('new-id');
    expect(window.location.search).toBe('?id=new-id');
    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.isDirty).toBe(false);
    await waitFor(() => expect(readDraft('new-id')?.dirty).toBe(false));
    expect(readDraft(null)).toBeNull();
  });

  it('updates an existing CV', async () => {
    setUrl('?id=cv-1');
    mocked.getCV.mockResolvedValue(record() as never);
    const { result } = await setup();
    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Edited')));

    await act(() => result.current.handleSave());

    expect(mocked.updateCV).toHaveBeenCalledWith(
      'cv-1',
      expect.objectContaining({ theme: 'modern' }),
      'token'
    );
    expect(mocked.createCV).not.toHaveBeenCalled();
  });

  it.each([404, 403])('saves as a new CV when the id answers %i', async (status) => {
    setUrl('?id=cv-1');
    mocked.getCV.mockResolvedValue(record() as never);
    const { result } = await setup();
    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Edited')));
    mocked.updateCV.mockRejectedValue(new ApiError('nope', status));

    await act(() => result.current.handleSave());

    expect(mocked.createCV).toHaveBeenCalledTimes(1);
    expect(result.current.resumeId).toBe('new-id');
  });

  it('saves Markdown-mode content as { mode, markdown }', async () => {
    const { result } = await setup();
    act(() => result.current.setEditMode('code'));
    act(() => result.current.setMarkdown('# Custom\n\nfree text'));

    await act(() => result.current.handleSave());

    expect(mocked.createCV.mock.calls[0][0].content).toEqual({
      mode: 'markdown',
      markdown: '# Custom\n\nfree text',
    });
    expect(mocked.createCV.mock.calls[0][0].title).toBe('Custom');
  });

  it('the free-plan limit opens the upgrade prompt instead of an error toast', async () => {
    const { result } = await setup();
    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Jane')));
    mocked.createCV.mockRejectedValue(new ApiError('Free tier limit reached', 403));

    await act(() => result.current.handleSave());

    expect(result.current.isAuthModalOpen).toBe(true);
    expect(result.current.authModalConfig.mode).toBe('upgrade');
    expect(result.current.authModalConfig.title).toBe(t.messages.limitTitle);
    expect(result.current.toasts).toHaveLength(0);
  });

  it('after a failed save, autosave waits for the next edit', async () => {
    setUrl('?id=cv-1');
    mocked.getCV.mockResolvedValue(record() as never);
    const { result } = await setup();
    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Edited')));
    expect(result.current.shouldAutosave).toBe(true);
    mocked.updateCV.mockRejectedValue(new ApiError('boom', 500));

    await act(() => result.current.handleSave());

    expect(result.current.saveStatus).toBe('error');
    expect(result.current.isDirty).toBe(true);
    expect(result.current.shouldAutosave).toBe(false);

    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Edited again')));
    expect(result.current.shouldAutosave).toBe(true);
  });

  it('stays dirty when the user edits while a save is in flight', async () => {
    setUrl('?id=cv-1');
    mocked.getCV.mockResolvedValue(record() as never);
    const { result } = await setup();
    act(() => result.current.handleDataChange(withName(result.current.cvData, 'First')));

    let finishRequest: () => void = () => {};
    mocked.updateCV.mockImplementation(
      () => new Promise((resolve) => (finishRequest = () => resolve(record() as never)))
    );

    let saving: Promise<void> = Promise.resolve();
    act(() => {
      saving = result.current.handleSave();
    });
    await waitFor(() => expect(mocked.updateCV).toHaveBeenCalled());
    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Second')));
    await act(async () => {
      finishRequest();
      await saving;
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.shouldAutosave).toBe(true);
  });

  it('never autosaves a CV that has not been saved yet, nor for guests', async () => {
    const { result } = await setup();
    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Jane')));
    expect(result.current.shouldAutosave).toBe(false);
  });

  it('Reset restores the sample CV but does not autosave it over the cloud copy', async () => {
    setUrl('?id=cv-1');
    mocked.getCV.mockResolvedValue(record() as never);
    const { result } = await setup();

    act(() => result.current.handleReset());

    expect(result.current.cvData.personal.name).toBe(initialCVData.personal.name);
    expect(result.current.isDirty).toBe(true);
    expect(result.current.shouldAutosave).toBe(false);

    // The next edit resumes autosave; undo brings the previous CV back
    act(() => result.current.handleDataChange(withName(result.current.cvData, 'After reset')));
    expect(result.current.shouldAutosave).toBe(true);
  });
});

// ── Undo / redo ─────────────────────────────────────────────────────────────

describe('undo', () => {
  it('a burst of edits is one step that restores the state before the burst', async () => {
    const { result } = await setup();
    vi.useFakeTimers();

    for (const name of ['J', 'Ja', 'Jan', 'Jane']) {
      act(() => result.current.handleDataChange(withName(result.current.cvData, name)));
    }
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.handleUndo());

    expect(result.current.cvData.personal.name).toBe(initialCVData.personal.name);
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.handleRedo());
    expect(result.current.cvData.personal.name).toBe('Jane');
  });

  it('works even before the burst has been committed to history', async () => {
    const { result } = await setup();

    act(() => result.current.handleDataChange(withName(result.current.cvData, 'Typing')));
    act(() => result.current.handleUndo());

    expect(result.current.cvData.personal.name).toBe(initialCVData.personal.name);
  });

  it('keeps at most 50 steps', async () => {
    const { result } = await setup();
    vi.useFakeTimers();

    for (let i = 0; i < 60; i++) {
      act(() => result.current.handleDataChange(withName(result.current.cvData, `v${i}`)));
      act(() => void vi.advanceTimersByTime(1000));
    }
    let steps = 0;
    while (result.current.canUndo && steps < 100) {
      act(() => result.current.handleUndo());
      steps++;
    }

    expect(steps).toBe(50);
  });
});

// ── Form ↔ Markdown ─────────────────────────────────────────────────────────

describe('edit modes', () => {
  it('goes to Markdown and back when the text still round-trips', async () => {
    const { result } = await setup();

    act(() => result.current.setEditMode('code'));
    expect(result.current.editMode).toBe('code');
    expect(result.current.markdown).toContain(`# ${initialCVData.personal.name}`);

    act(() => result.current.setMarkdown(result.current.markdown.replace('John Doe', 'Jane Roe')));
    act(() => result.current.setEditMode('form'));

    expect(result.current.editMode).toBe('form');
    expect(result.current.cvData.personal.name).toBe('Jane Roe');
  });

  it('stays in Markdown mode when converting would lose content', async () => {
    const { result } = await setup();
    act(() => result.current.setEditMode('code'));
    act(() => result.current.setMarkdown(result.current.markdown + '\n\n<table><tr><td>hand-made'));

    act(() => result.current.setEditMode('form'));

    expect(result.current.editMode).toBe('code');
    expect(result.current.toasts.at(-1)?.message).toBe(t.header.parseError);
  });
});

// ── AI ──────────────────────────────────────────────────────────────────────

describe('AI actions', () => {
  const asPro = () =>
    mocked.getUserProfile.mockResolvedValue({ id: 'user_1', is_pro: true, pro_expires_at: null });

  it('guests get the sign-in prompt and free users the upgrade prompt, without a request', async () => {
    auth.userId = null;
    const guest = await setup();
    await act(() => guest.result.current.handleAiAction('enhance'));
    expect(guest.result.current.authModalConfig.mode).toBe('auth');
    guest.unmount();

    auth.userId = 'user_1';
    const free = await setup();
    await act(() => free.result.current.handleAiAction('enhance'));
    expect(free.result.current.authModalConfig.mode).toBe('upgrade');

    expect(mocked.rewriteCV).not.toHaveBeenCalled();
    expect(await free.result.current.handleAtsAnalysis('job')).toBeNull();
    expect(await free.result.current.handleGenerateCoverLetter('job')).toBeNull();
  });

  it('sends a structured request and keeps anything the model dropped', async () => {
    asPro();
    const { result } = await setup();
    await waitFor(() => expect(result.current.isPro).toBe(true));
    mocked.rewriteCV.mockResolvedValue({
      cv: {
        personal: { summary: 'Sharper summary', name: '', socials: [] },
        experience: [],
        sectionOrder: ['custom'],
      },
    });

    await act(() => result.current.handleAiAction('optimize', 'Senior Python role'));

    expect(mocked.rewriteCV).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'optimize',
        target_language: 'es',
        job_description: 'Senior Python role',
      }),
      'token'
    );
    expect(result.current.isChoiceModalOpen).toBe(true);

    await act(() => result.current.handleChoiceApplied('overwrite'));

    const cv = result.current.cvData;
    expect(cv.personal.summary).toBe('Sharper summary');
    expect(cv.personal.name).toBe(initialCVData.personal.name);
    expect(cv.personal.socials).toEqual(initialCVData.personal.socials);
    expect(cv.experience).toEqual(initialCVData.experience);
    expect(cv.sectionOrder?.[0]).toBe('experience');
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.handleUndo());
    expect(result.current.cvData.personal.summary).toBe(initialCVData.personal.summary);
  });

  it('"create a copy" saves the result as a new CV and switches to it', async () => {
    asPro();
    setUrl('?id=cv-1');
    mocked.getCV.mockResolvedValue(record() as never);
    const { result } = await setup();
    await waitFor(() => expect(result.current.isPro).toBe(true));
    mocked.rewriteCV.mockResolvedValue({ cv: { personal: { summary: 'Traducido' } } });
    mocked.createCV.mockResolvedValue(record({ id: 'copy-id' }) as never);

    await act(() => result.current.handleAiAction('translate'));
    await act(() => result.current.handleChoiceApplied('copy'));

    expect(mocked.createCV.mock.calls[0][0]).toMatchObject({
      title: 'Server title (AI)',
      language: 'ES',
    });
    expect(result.current.resumeId).toBe('copy-id');
    expect(result.current.cvData.personal.summary).toBe('Traducido');
    expect(result.current.isDirty).toBe(false);
  });

  it('maps backend answers: 403 → upgrade prompt, 429 → limit toast, other → error toast', async () => {
    asPro();
    const { result } = await setup();
    await waitFor(() => expect(result.current.isPro).toBe(true));

    mocked.simulateATS.mockRejectedValue(new ApiError('limit', 429));
    await act(async () => void (await result.current.handleAtsAnalysis('job')));
    expect(result.current.toasts.at(-1)?.message).toBe(t.messages.aiRateLimited);

    mocked.generateCoverLetter.mockRejectedValue(new ApiError('down', 502));
    await act(async () => void (await result.current.handleGenerateCoverLetter('job')));
    expect(result.current.toasts.at(-1)?.message).toBe(t.messages.coverLetterError);

    mocked.rewriteCV.mockRejectedValue(new ApiError('expired', 403));
    await act(() => result.current.handleAiAction('enhance'));
    expect(result.current.authModalConfig.mode).toBe('upgrade');
    expect(result.current.isPro).toBe(false);
  });

  it('returns the cover letter text, not the response object', async () => {
    asPro();
    const { result } = await setup();
    await waitFor(() => expect(result.current.isPro).toBe(true));
    mocked.generateCoverLetter.mockResolvedValue({ cover_letter: 'Dear team,' });

    let letter: string | null = null;
    await act(async () => {
      letter = await result.current.handleGenerateCoverLetter('job');
    });

    expect(letter).toBe('Dear team,');
    expect(mocked.generateCoverLetter).toHaveBeenCalledWith(
      expect.anything(),
      'job',
      'es',
      'token'
    );
  });
});
