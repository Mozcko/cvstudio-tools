/**
 * Runs `worker` over `items`, a few at a time and in order. A worker that returns false stops
 * the pool: items not yet started are handed to `onSkipped` instead.
 */
export async function runPool<T>(
  items: T[],
  worker: (item: T) => Promise<boolean | void>,
  { concurrency = 3, onSkipped }: { concurrency?: number; onSkipped?: (item: T) => void } = {}
): Promise<void> {
  let next = 0;
  let stopped = false;

  const lane = async () => {
    while (next < items.length) {
      const item = items[next++];
      if (stopped) {
        onSkipped?.(item);
        continue;
      }
      if ((await worker(item)) === false) stopped = true;
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, lane));
}
