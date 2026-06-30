// Breach Protocol — pure game logic (no React/DOM), unit-tested in breach.test.ts.
// Faithful to the TOPY.OS design: a 6x6 code matrix, a single 4-code daemon, and a
// 9-slot buffer. Picks alternate row -> column -> row; a pick locks the next axis to the
// cell you chose. You win when your buffer ENDS with the full daemon. Board generation
// walks a legal path first and reads the daemon off it, so every matrix is solvable.

export type Code = string; // two-hex-digit token, e.g. '1C'
export type Cell = { r: number; c: number };
export type Axis = 'row' | 'col';

export const CODES: Code[] = ['1C', '55', 'BD', 'E9', '7A', 'FF', 'A1', '2D'];

export const keyOf = (c: Cell): string => `${c.r},${c.c}`;

export interface Board {
  grid: Code[][]; // grid[r][c]
  target: Code[]; // the daemon to intercept
  solutionPath: Cell[]; // one guaranteed-winning pick order (length === target.length)
}

export interface GenerateOptions {
  size?: number; // grid is size x size (default 6)
  daemonLen?: number; // daemon length (default 4)
  rng?: () => number; // injectable RNG for deterministic tests (default Math.random)
}

// mulberry32 — small, fast, deterministic PRNG in [0, 1).
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];

/**
 * Cells legally pickable on the currently locked line, excluding used cells.
 * - axis 'row': any cell in row `lockIndex`.
 * - axis 'col': any cell in column `lockIndex`.
 */
export function legalCells(size: number, axis: Axis, lockIndex: number, used: Set<string>): Cell[] {
  const out: Cell[] = [];
  if (axis === 'row') {
    for (let c = 0; c < size; c++) if (!used.has(`${lockIndex},${c}`)) out.push({ r: lockIndex, c });
  } else {
    for (let r = 0; r < size; r++) if (!used.has(`${r},${lockIndex}`)) out.push({ r, c: lockIndex });
  }
  return out;
}

/** After picking `cell` on `axis`, the next pick locks to the perpendicular line. */
export function nextLock(axis: Axis, cell: Cell): { axis: Axis; lockIndex: number } {
  return axis === 'row' ? { axis: 'col', lockIndex: cell.c } : { axis: 'row', lockIndex: cell.r };
}

/** A legal alternating walk of up to `len` cells, starting free in row 0. */
export function genPath(size: number, len: number, rng: () => number): Cell[] {
  const path: Cell[] = [];
  const used = new Set<string>();
  let axis: Axis = 'row';
  let lockIndex = 0;
  for (let i = 0; i < len; i++) {
    const cands = legalCells(size, axis, lockIndex, used);
    if (!cands.length) break;
    const p = pick(cands, rng);
    used.add(keyOf(p));
    path.push(p);
    ({ axis, lockIndex } = nextLock(axis, p));
  }
  return path;
}

/**
 * Longest suffix of `buffer` that is a prefix of `target`. Win is `progress === target.length`
 * (the daemon sits at the tail of the buffer). A wrong pick breaks the suffix and drops it.
 */
export function progress(buffer: Code[], target: Code[]): number {
  const max = Math.min(target.length, buffer.length);
  for (let k = max; k >= 1; k--) {
    let ok = true;
    for (let j = 0; j < k; j++) {
      if (buffer[buffer.length - k + j] !== target[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return k;
  }
  return 0;
}

export function isWin(buffer: Code[], target: Code[]): boolean {
  return target.length > 0 && progress(buffer, target) >= target.length;
}

export function isFail(buffer: Code[], bufferSize: number, target: Code[]): boolean {
  return buffer.length >= bufferSize && !isWin(buffer, target);
}

export function generateBoard(opts: GenerateOptions = {}): Board {
  const size = opts.size ?? 6;
  const daemonLen = opts.daemonLen ?? 4;
  const rng = opts.rng ?? Math.random;
  const pathLen = daemonLen + 3; // extra slack so the walk rarely dead-ends short

  let grid: Code[][] = [];
  let path: Cell[] = [];
  let tries = 0;
  do {
    grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => pick(CODES, rng)),
    );
    path = genPath(size, pathLen, rng);
    tries++;
  } while (path.length < daemonLen && tries < 60);
  if (path.length < daemonLen) throw new Error('could not generate a solvable board');

  const solutionPath = path.slice(0, daemonLen);
  const target = solutionPath.map((p) => grid[p.r][p.c]);
  return { grid, target, solutionPath };
}
