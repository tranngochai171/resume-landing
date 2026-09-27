import { describe, expect, it, vi } from 'vitest';
import { CANCELLED, slicer } from './yield';

describe('slicer', () => {
  it('yields only once the work budget is spent, then restarts the budget', async () => {
    vi.useFakeTimers();
    let t = 0;
    const slice = slicer(10, { now: () => t });
    let done = false;
    t = 5;
    await slice(); // under budget: returns without yielding
    t = 12;
    const p = slice().then(() => (done = true)); // over budget: waits for a macrotask
    await Promise.resolve();
    expect(done).toBe(false);
    await vi.runAllTimersAsync();
    await p;
    expect(done).toBe(true);
    t = 15;
    done = false;
    await slice().then(() => (done = true)); // budget restarted at 12
    expect(done).toBe(true);
    vi.useRealTimers();
  });

  it('throws CANCELLED at the next step once the work is cancelled', async () => {
    let dead = false;
    const slice = slicer(1000, { cancelled: () => dead });
    await expect(slice()).resolves.toBeUndefined();
    dead = true;
    await expect(slice()).rejects.toBe(CANCELLED);
  });
});
