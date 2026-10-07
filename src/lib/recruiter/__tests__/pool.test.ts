import { describe, expect, it } from 'vitest';
import { runPool } from '../pool';

describe('runPool', () => {
  it('handles every item, never more than the limit at once', async () => {
    let running = 0;
    let most = 0;
    const done: number[] = [];
    await runPool(
      [1, 2, 3, 4, 5, 6, 7],
      async (n) => {
        most = Math.max(most, ++running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        running--;
        done.push(n);
      },
      { concurrency: 3 }
    );
    expect(done.sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(most).toBe(3);
  });

  it('stops starting new items once a worker says so', async () => {
    const started: number[] = [];
    const skipped: number[] = [];
    await runPool(
      [1, 2, 3, 4],
      async (n) => {
        started.push(n);
        return n !== 2;
      },
      { concurrency: 1, onSkipped: (n) => skipped.push(n) }
    );
    expect(started).toEqual([1, 2]);
    expect(skipped).toEqual([3, 4]);
  });

  it('does nothing with an empty list', async () => {
    await expect(runPool([], async () => {})).resolves.toBeUndefined();
  });
});
