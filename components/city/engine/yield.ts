// Cooperative scheduling for the engine start-up: keep every main-thread task short so input
// (SKIP, keys) stays responsive and no long task blocks the page while the city is built.

type Scheduler = { yield?: () => Promise<void> };

/** Give the main thread back (scheduler.yield keeps our place in line; setTimeout(0) elsewhere). */
export function yieldToMain(): Promise<void> {
  const s = (globalThis as { scheduler?: Scheduler }).scheduler;
  return s?.yield ? s.yield() : new Promise((r) => setTimeout(r, 0));
}

/** Thrown by a slice once the work it paces has been cancelled (the engine was disposed). */
export const CANCELLED = new Error('city start-up cancelled');

/**
 * Returns `slice()`: await it between steps of long work. It only yields once `budgetMs` of
 * work has run since the last yield, so frequent calls are cheap. Once `cancelled()` is true it
 * throws CANCELLED, so the work stops at its next step instead of running on against a dead engine.
 */
export function slicer(budgetMs: number, { cancelled = () => false, now = () => performance.now() }: { cancelled?: () => boolean; now?: () => number } = {}) {
  let t0 = now();
  return async () => {
    if (now() - t0 >= budgetMs) {
      await yieldToMain();
      t0 = now();
    }
    if (cancelled()) throw CANCELLED;
  };
}

export type Slice = ReturnType<typeof slicer>;
