import { useCallback, useEffect, useRef, useState } from 'react';

/** Longest answer we record; the backend accepts up to 5 MB, which this stays well under. */
export const MAX_RECORDING_SECONDS = 120;

// In order of preference. Safari only records MP4; Firefox prefers Ogg.
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

/** The first recording format this browser supports, or null when it cannot record at all. */
export function pickMimeType(
  isSupported: (type: string) => boolean = (type) =>
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)
): string | null {
  return MIME_CANDIDATES.find((type) => isSupported(type)) ?? null;
}

export const canRecord = (): boolean =>
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof MediaRecorder !== 'undefined' &&
  pickMimeType() !== null;

export type RecorderStatus = 'idle' | 'recording' | 'denied' | 'unsupported';

/**
 * Records one answer from the microphone. `start()` asks for permission the first time;
 * `stop()` resolves with the recording, or null if nothing was captured.
 */
export default function useRecorder(onAutoStop?: (recording: Blob | null) => void) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopResolverRef = useRef<((recording: Blob | null) => void) | null>(null);
  const autoStopRef = useRef(onAutoStop);

  useEffect(() => {
    autoStopRef.current = onAutoStop;
  }, [onAutoStop]);

  const cleanUp = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
  }, []);

  const stop = useCallback((): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return Promise.resolve(null);
    return new Promise((resolve) => {
      stopResolverRef.current = resolve;
      recorder.stop();
    });
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (recorderRef.current) return true;
    const mimeType = pickMimeType();
    if (!canRecord() || !mimeType) {
      setStatus('unsupported');
      return false;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus('denied');
      return false;
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      // The container type without codec parameters is what the server checks
      const recording =
        chunksRef.current.length > 0
          ? new Blob(chunksRef.current, { type: mimeType.split(';')[0] })
          : null;
      cleanUp();
      setStatus('idle');
      const resolve = stopResolverRef.current;
      stopResolverRef.current = null;
      if (resolve) resolve(recording);
      else autoStopRef.current?.(recording);
    };

    recorderRef.current = recorder;
    recorder.start();
    setSeconds(0);
    setStatus('recording');
    timerRef.current = setInterval(() => {
      setSeconds((current) => {
        if (current + 1 >= MAX_RECORDING_SECONDS && recorder.state === 'recording') recorder.stop();
        return current + 1;
      });
    }, 1000);
    return true;
  }, [cleanUp]);

  // Release the microphone if the component goes away mid-recording
  useEffect(
    () => () => {
      stopResolverRef.current = null;
      autoStopRef.current = undefined;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      cleanUp();
    },
    [cleanUp]
  );

  return { status, seconds, start, stop };
}
