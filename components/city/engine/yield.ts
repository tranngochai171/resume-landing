// Cooperative scheduling for the engine start-up: keep every main-thread task short so input
// (SKIP, keys) stays responsive and no long task blocks the page while the city is built.

type Scheduler = { yield?: () => Promise<void> };

/** Give the main thread back (scheduler.yield keeps our place in line; setTimeout(0) elsewhere). */
export function yieldToMain(): Promise<void> {
  const s = (globalThis as { scheduler?: Scheduler }).scheduler;
  return s?.yield ? s.yield() : new Promise((r) => setTimeout(r, 0));
}

/**
 * Returns `slice()`: await it between steps of long work. It only yields once `budgetMs` of
 * work has run since the last yield, so frequent calls are cheap.
 */
export function slicer(budgetMs: number, now: () => number = () => performance.now()) {
  let t0 = now();
  return async () => {
    if (now() - t0 < budgetMs) return;
    await yieldToMain();
    t0 = now();
  };
}

export type Slice = ReturnType<typeof slicer>;
