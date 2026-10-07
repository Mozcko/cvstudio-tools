// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, type InterviewSession, type InterviewTurn } from '../../lib/api';
import { initialCVData } from '../../types/cv';
import useInterview from '../useInterview';
import { pickMimeType } from '../useRecorder';

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/api')>();
  return {
    ...actual,
    api: {
      startInterview: vi.fn(),
      answerInterviewText: vi.fn(),
      answerInterviewAudio: vi.fn(),
      getInterviewAudio: vi.fn(),
      finishInterview: vi.fn(),
      getInterview: vi.fn(),
    },
  };
});

const mocked = vi.mocked(api);
const getToken = async () => 'token';

const turn = (
  index: number,
  role: InterviewTurn['role'],
  kind: InterviewTurn['kind'],
  question: number
): InterviewTurn => ({
  index,
  role,
  kind,
  question,
  text: `${role} ${index}`,
  at: '2026-10-07T10:00:00Z',
});

const session = (overrides: Partial<InterviewSession> = {}): InterviewSession => ({
  id: 'int-1',
  title: 'Senior Python Engineer',
  language: 'es',
  status: 'active',
  question_count: 2,
  overall_score: null,
  created_at: '2026-10-07T10:00:00Z',
  completed_at: null,
  current_question: 0,
  done: false,
  questions: ['Q0'],
  turns: [turn(0, 'recruiter', 'question', 0)],
  report: null,
  ...overrides,
});

const completed = () =>
  session({
    status: 'completed',
    done: true,
    current_question: 2,
    overall_score: 80,
    report: {
      overall_score: 80,
      summary: 'Good',
      strengths: [],
      improvements: [],
      tips: [],
      answers: [],
    },
  });

const reply = (index: number, kind: InterviewTurn['kind'], question: number, done = false) => ({
  answer: turn(
    index,
    'candidate',
    'answer',
    kind === 'closing' ? question : Math.max(0, question - (kind === 'question' ? 1 : 0))
  ),
  reply: turn(index + 1, 'recruiter', kind, question),
  current_question: done ? 2 : question,
  done,
});

const startParams = {
  cv: initialCVData,
  jobDescription: 'A job posting long enough',
  language: 'es' as const,
  questionCount: 2,
};

/** A stand-in for the audio element: `finish()` behaves like playback reaching the end. */
class FakeAudio {
  static instances: FakeAudio[] = [];
  static blockAutoplay = false;
  src = '';
  onended: (() => void) | null = null;
  play = vi.fn(async () => {
    if (FakeAudio.blockAutoplay) throw new Error('NotAllowedError');
  });
  pause = vi.fn();
  constructor() {
    FakeAudio.instances.push(this);
  }
  finish() {
    this.onended?.();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  FakeAudio.instances = [];
  FakeAudio.blockAutoplay = false;
  vi.stubGlobal('Audio', FakeAudio);
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
  mocked.startInterview.mockResolvedValue(session());
  mocked.getInterviewAudio.mockResolvedValue(new Blob(['mp3'], { type: 'audio/mpeg' }));
  mocked.finishInterview.mockResolvedValue(completed());
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('pickMimeType', () => {
  it('prefers WebM/Opus, falls back to what the browser has', () => {
    expect(pickMimeType(() => true)).toBe('audio/webm;codecs=opus');
    // Safari
    expect(pickMimeType((type) => type === 'audio/mp4')).toBe('audio/mp4');
    // Firefox without WebM
    expect(pickMimeType((type) => type.startsWith('audio/ogg'))).toBe('audio/ogg;codecs=opus');
    expect(pickMimeType(() => false)).toBeNull();
  });
});

describe('useInterview', () => {
  it('with voice on: plays each recruiter line, then listens', async () => {
    const { result } = renderHook(() => useInterview(getToken));
    expect(result.current.phase).toBe('setup');

    await act(() => result.current.start(startParams));

    expect(mocked.startInterview).toHaveBeenCalledWith(
      {
        cv_content: initialCVData,
        job_description: startParams.jobDescription,
        language: 'es',
        question_count: 2,
      },
      'token'
    );
    expect(mocked.getInterviewAudio).toHaveBeenCalledWith('int-1', 0, 'token');
    expect(result.current.phase).toBe('speaking');
    const audio = FakeAudio.instances[0];
    expect(audio.play).toHaveBeenCalled();

    act(() => audio.finish());
    expect(result.current.phase).toBe('listening');

    mocked.answerInterviewText.mockResolvedValue(reply(1, 'question', 1));
    await act(() => result.current.submit('My answer'));

    expect(mocked.answerInterviewText).toHaveBeenCalledWith('int-1', 'My answer', 'token');
    expect(result.current.session?.turns).toHaveLength(3);
    expect(result.current.session?.current_question).toBe(1);
    expect(mocked.getInterviewAudio).toHaveBeenLastCalledWith('int-1', 2, 'token');
    expect(result.current.phase).toBe('speaking');
  });

  it('writes the report after the closing line has been heard, exactly once', async () => {
    const { result } = renderHook(() => useInterview(getToken));
    await act(() => result.current.start(startParams));
    act(() => FakeAudio.instances[0].finish());

    mocked.answerInterviewAudio.mockResolvedValue(reply(1, 'closing', 1, true));
    const recording = new Blob(['audio'], { type: 'audio/webm' });
    await act(() => result.current.submit(recording));

    expect(mocked.answerInterviewAudio).toHaveBeenCalledWith('int-1', recording, 'token');
    expect(result.current.phase).toBe('speaking');
    expect(mocked.finishInterview).not.toHaveBeenCalled();

    await act(async () => FakeAudio.instances[0].finish());
    await waitFor(() => expect(result.current.phase).toBe('report'));
    expect(mocked.finishInterview).toHaveBeenCalledTimes(1);
    expect(result.current.session?.report?.overall_score).toBe(80);
  });

  it('with voice off: no audio is requested and the interview still flows to the report', async () => {
    const { result } = renderHook(() => useInterview(getToken));
    act(() => result.current.setVoiceOn(false));

    await act(() => result.current.start(startParams));
    expect(result.current.phase).toBe('listening');

    mocked.answerInterviewText.mockResolvedValue(reply(1, 'closing', 1, true));
    await act(() => result.current.submit('Only answer'));
    await waitFor(() => expect(result.current.phase).toBe('report'));

    expect(mocked.getInterviewAudio).not.toHaveBeenCalled();
    expect(mocked.finishInterview).toHaveBeenCalledTimes(1);
  });

  it('when the browser blocks autoplay, a tap plays the line', async () => {
    FakeAudio.blockAutoplay = true;
    const { result } = renderHook(() => useInterview(getToken));

    await act(() => result.current.start(startParams));
    expect(result.current.needsTap).toBe(true);
    expect(result.current.phase).toBe('speaking');

    FakeAudio.blockAutoplay = false;
    await act(() => result.current.replay());
    expect(result.current.needsTap).toBe(false);
    // The same audio is played; it is not generated (and paid for) again
    expect(mocked.getInterviewAudio).toHaveBeenCalledTimes(1);
  });

  it('skipping the audio hands the turn over, and a late "ended" changes nothing', async () => {
    const { result } = renderHook(() => useInterview(getToken));
    await act(() => result.current.start(startParams));
    const audio = FakeAudio.instances[0];

    act(() => result.current.skipSpeech());
    expect(result.current.phase).toBe('listening');
    expect(audio.pause).toHaveBeenCalled();

    mocked.answerInterviewText.mockImplementation(() => new Promise(() => {}));
    act(() => void result.current.submit('answer'));
    expect(result.current.phase).toBe('thinking');
    act(() => audio.finish());
    expect(result.current.phase).toBe('thinking');
  });

  it('carries on in text when the audio cannot be fetched', async () => {
    mocked.getInterviewAudio.mockRejectedValue(new ApiError('Audio limit reached', 429));
    const { result } = renderHook(() => useInterview(getToken));

    await act(() => result.current.start(startParams));

    expect(result.current.phase).toBe('listening');
    expect(result.current.error).toBeNull();
  });

  it.each([
    [403, 'x', 'premium'],
    [429, 'Daily interview limit reached. Come back tomorrow.', 'dailyLimit'],
    [429, 'Monthly interview limit reached.', 'monthlyLimit'],
    [503, 'x', 'unavailable'],
    [502, 'x', 'failed'],
  ])('a %i when starting ("%s") stays on setup with error "%s"', async (status, detail, code) => {
    mocked.startInterview.mockRejectedValue(new ApiError(detail, status));
    const { result } = renderHook(() => useInterview(getToken));

    await act(() => result.current.start(startParams));

    expect(result.current.phase).toBe('setup');
    expect(result.current.error).toBe(code);
    expect(result.current.session).toBeNull();
  });

  it.each([
    [422, 'notHeard'],
    [413, 'tooLong'],
    [409, 'expired'],
    [502, 'failed'],
  ])('a %i on an answer lets the candidate try again (error "%s")', async (status, code) => {
    const { result } = renderHook(() => useInterview(getToken));
    act(() => result.current.setVoiceOn(false));
    await act(() => result.current.start(startParams));

    mocked.answerInterviewText.mockRejectedValue(new ApiError('nope', status));
    await act(() => result.current.submit('answer'));

    expect(result.current.phase).toBe('listening');
    expect(result.current.error).toBe(code);
    expect(result.current.session?.turns).toHaveLength(1);
  });

  it('ignores answers when it is not the candidate turn', async () => {
    const { result } = renderHook(() => useInterview(getToken));
    await act(() => result.current.submit('too early'));
    await act(() => result.current.start(startParams));
    await act(() => result.current.submit('while the recruiter speaks'));
    expect(mocked.answerInterviewText).not.toHaveBeenCalled();
  });

  it('ending early writes the report; a failed report can be retried', async () => {
    const { result } = renderHook(() => useInterview(getToken));
    act(() => result.current.setVoiceOn(false));
    await act(() => result.current.start(startParams));

    mocked.finishInterview.mockRejectedValueOnce(new ApiError('boom', 502));
    await act(() => result.current.finish());
    expect(result.current.phase).toBe('listening');
    expect(result.current.error).toBe('failed');

    await act(() => result.current.finish());
    expect(result.current.phase).toBe('report');
    expect(result.current.error).toBeNull();
  });

  it('opens stored interviews where they were left', async () => {
    const { result } = renderHook(() => useInterview(getToken));

    mocked.getInterview.mockResolvedValue(completed());
    await act(() => result.current.open('int-1'));
    expect(result.current.phase).toBe('report');

    mocked.getInterview.mockResolvedValue(session());
    await act(() => result.current.open('int-1'));
    expect(result.current.phase).toBe('listening');

    act(() => result.current.reset());
    expect(result.current.phase).toBe('setup');
    expect(result.current.session).toBeNull();
  });
});
