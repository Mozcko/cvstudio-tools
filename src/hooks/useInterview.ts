import { useCallback, useEffect, useRef, useState } from 'react';
import { api, isApiError, type InterviewSession } from '../lib/api';
import type { CVData, CVLang } from '../types/cv';

/**
 * setup      nothing started yet
 * starting   questions are being prepared
 * speaking   the recruiter's line is being played (or waits for a tap to play)
 * listening  the candidate's turn
 * thinking   the answer was sent; waiting for the recruiter
 * finishing  the report is being written
 * report     done
 */
export type InterviewPhase =
  'setup' | 'starting' | 'speaking' | 'listening' | 'thinking' | 'finishing' | 'report';

export type InterviewErrorCode =
  | 'premium' // plan does not include interviews (any more)
  | 'dailyLimit'
  | 'monthlyLimit'
  | 'notHeard' // nothing audible in the recording
  | 'tooLong'
  | 'expired'
  | 'unavailable' // AI not configured
  | 'failed';

export interface StartParams {
  cv: CVData;
  jobDescription: string;
  language: CVLang;
  questionCount: number;
}

const errorCodeOf = (error: unknown): InterviewErrorCode => {
  if (isApiError(error, 403)) return 'premium';
  if (isApiError(error, 429)) return /month/i.test(error.message) ? 'monthlyLimit' : 'dailyLimit';
  if (isApiError(error, 422)) return 'notHeard';
  if (isApiError(error, 413)) return 'tooLong';
  if (isApiError(error, 409)) return 'expired';
  if (isApiError(error, 503)) return 'unavailable';
  return 'failed';
};

/** Drives one mock interview: the conversation state, the recruiter's audio, and the report. */
export default function useInterview(getToken: () => Promise<string | null>) {
  const [phase, setPhase] = useState<InterviewPhase>('setup');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [error, setError] = useState<InterviewErrorCode | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  // The browser refused to start audio by itself: the user has to tap "play"
  const [needsTap, setNeedsTap] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const voiceOnRef = useRef(voiceOn);
  // Bumped whenever playback is superseded, so a late "ended" cannot change the phase
  const playbackRef = useRef(0);
  const finishingRef = useRef(false);

  useEffect(() => {
    voiceOnRef.current = voiceOn;
  }, [voiceOn]);

  const stopAudio = useCallback(() => {
    playbackRef.current++;
    audioRef.current?.pause();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setNeedsTap(false);
  }, []);

  useEffect(() => stopAudio, [stopAudio]);

  /** Plays a recruiter turn, then hands over to the candidate (or to the report). */
  const speak = useCallback(
    async (current: InterviewSession, turnIndex: number) => {
      const after: InterviewPhase = current.done ? 'finishing' : 'listening';
      stopAudio();
      if (!voiceOnRef.current) {
        setPhase(after);
        return after;
      }

      setPhase('speaking');
      const playback = playbackRef.current;
      try {
        const blob = await api.getInterviewAudio(current.id, turnIndex, await getToken());
        if (playback !== playbackRef.current) return after;
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = url;
        audio.onended = () => {
          if (playback !== playbackRef.current) return;
          setNeedsTap(false);
          setPhase((now) => (now === 'speaking' ? after : now));
        };
        try {
          await audio.play();
        } catch {
          // Autoplay was blocked: the text is on screen and a button plays it
          if (playback === playbackRef.current) setNeedsTap(true);
        }
      } catch (err) {
        // No audio is not a reason to stop: the question can be read
        console.error(err);
        if (playback === playbackRef.current) setPhase(after);
      }
      return after;
    },
    [getToken, stopAudio]
  );

  /** Ends the interview (at any point) and fetches the report. */
  const finish = useCallback(
    async (current: InterviewSession | null = session) => {
      // One report request at a time: both a click and the phase change below can ask for it
      if (!current || finishingRef.current) return;
      finishingRef.current = true;
      stopAudio();
      setError(null);
      setPhase('finishing');
      try {
        setSession(await api.finishInterview(current.id, await getToken()));
        setPhase('report');
      } catch (err) {
        console.error(err);
        setError(errorCodeOf(err));
        // Stay where a retry makes sense
        setPhase(current.done ? 'finishing' : 'listening');
      } finally {
        finishingRef.current = false;
      }
    },
    [getToken, session, stopAudio]
  );

  // Once the closing line has been spoken (or skipped), write the report
  useEffect(() => {
    if (phase === 'finishing' && session && session.status !== 'completed') finish(session);
    // Only react to entering the phase
  }, [phase]);

  const start = useCallback(
    async (params: StartParams) => {
      setError(null);
      setPhase('starting');
      // Created during the click so browsers that need a user gesture let it play later
      audioRef.current = audioRef.current ?? new Audio();
      try {
        const created = await api.startInterview(
          {
            cv_content: params.cv,
            job_description: params.jobDescription,
            language: params.language,
            question_count: params.questionCount,
          },
          await getToken()
        );
        setSession(created);
        await speak(created, 0);
      } catch (err) {
        console.error(err);
        setError(errorCodeOf(err));
        setPhase('setup');
      }
    },
    [getToken, speak]
  );

  const submit = useCallback(
    async (answer: Blob | string) => {
      if (!session || phase !== 'listening') return;
      setError(null);
      setPhase('thinking');
      try {
        const token = await getToken();
        const result =
          typeof answer === 'string'
            ? await api.answerInterviewText(session.id, answer, token)
            : await api.answerInterviewAudio(session.id, answer, token);
        const next: InterviewSession = {
          ...session,
          turns: [...session.turns, result.answer, result.reply],
          current_question: result.current_question,
          done: result.done,
        };
        setSession(next);
        await speak(next, result.reply.index);
      } catch (err) {
        console.error(err);
        setError(errorCodeOf(err));
        setPhase('listening');
      }
    },
    [getToken, phase, session, speak]
  );

  /** Replays the recruiter's last line (also the button shown when autoplay was blocked). */
  const replay = useCallback(async () => {
    if (!session) return;
    const last = [...session.turns].reverse().find((turn) => turn.role === 'recruiter');
    if (!last) return;
    const audio = audioRef.current;
    if (needsTap && audio && urlRef.current) {
      try {
        await audio.play();
        setNeedsTap(false);
      } catch (err) {
        console.error(err);
      }
      return;
    }
    await speak(session, last.index);
  }, [needsTap, session, speak]);

  /** Skips what is being said and gives the turn to the candidate. */
  const skipSpeech = useCallback(() => {
    if (phase !== 'speaking' || !session) return;
    stopAudio();
    setPhase(session.done ? 'finishing' : 'listening');
  }, [phase, session, stopAudio]);

  /** Opens a stored interview: its report, or the conversation where it was left. */
  const open = useCallback(
    async (id: string) => {
      setError(null);
      stopAudio();
      try {
        const stored = await api.getInterview(id, await getToken());
        setSession(stored);
        setPhase(
          stored.status === 'completed' ? 'report' : stored.done ? 'finishing' : 'listening'
        );
      } catch (err) {
        console.error(err);
        setError(errorCodeOf(err));
      }
    },
    [getToken, stopAudio]
  );

  const reset = useCallback(() => {
    stopAudio();
    setSession(null);
    setError(null);
    setPhase('setup');
  }, [stopAudio]);

  return {
    phase,
    session,
    error,
    voiceOn,
    setVoiceOn,
    needsTap,
    start,
    submit,
    finish,
    replay,
    skipSpeech,
    open,
    reset,
    clearError: () => setError(null),
  };
}
