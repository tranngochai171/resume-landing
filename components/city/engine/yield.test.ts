import { describe, expect, it, vi } from 'vitest';
import { slicer } from './yield';

describe('slicer', () => {
  it('yields only once the work budget is spent, then restarts the budget', async () => {
    vi.useFakeTimers();
    let t = 0;
    const slice = slicer(10, () => t);
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
});
