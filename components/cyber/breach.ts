// Breach Protocol — pure game logic (no React/DOM), unit-tested in breach.test.ts.
// A faithful-but-trimmed take on Cyberpunk 2077's hacking minigame: pick codes from a
// matrix, alternating row -> column -> row, to build a buffer that contains each target
// sequence as a contiguous run. Board generation guarantees the puzzle is always solvable.

export type Code = string; // two-hex-digit token, e.g. '1C'
export type Cell = { r: number; c: number };

export const CODES: Code[] = ['1C', '55', 'BD', 'E9', '7A', 'FF'];

export interface Board {
  grid: Code[][]; // grid[r][c]
  sequences: Code[][]; // target sequences (daemons)
  solutionPath: Cell[]; // one guaranteed-winning pick order
}

export interface GenerateOptions {
  size?: number; // grid is size x size (default 5)
  bufferSize?: number; // max picks (default 7)
  seqLengths?: number[]; // length of each target sequence (default [2, 3, 3])
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
 * Cells the player may legally pick next, given the picks made so far.
 * - No picks yet: anywhere in the top row (row 0).
 * - Odd number of picks: locked to the last pick's COLUMN.
 * - Even number of picks (>0): locked to the last pick's ROW.
 * Already-used cells are always excluded.
 */
export function legalCells(size: number, picks: Cell[]): Cell[] {
  const used = new Set(picks.map((p) => `${p.r},${p.c}`));
  const free = (cells: Cell[]) => cells.filter((c) => !used.has(`${c.r},${c.c}`));

  if (picks.length === 0) {
    return free(Array.from({ length: size }, (_, c) => ({ r: 0, c })));
  }
  const last = picks[picks.length - 1];
  if (picks.length % 2 === 1) {
    // column lock
    return free(Array.from({ length: size }, (_, r) => ({ r, c: last.c })));
  }
  // row lock
  return free(Array.from({ length: size }, (_, c) => ({ r: last.r, c })));
}

export function codesAlong(grid: Code[][], path: Cell[]): Code[] {
  return path.map((c) => grid[c.r][c.c]);
}

const containsRun = (buffer: Code[], seq: Code[]): boolean => {
  if (seq.length === 0 || seq.length > buffer.length) return false;
  for (let i = 0; i + seq.length <= buffer.length; i++) {
    let hit = true;
    for (let j = 0; j < seq.length; j++) {
      if (buffer[i + j] !== seq[j]) {
        hit = false;
        break;
      }
    }
    if (hit) return true;
  }
  return false;
};

export function evaluateSequences(buffer: Code[], sequences: Code[][]): boolean[] {
  return sequences.map((s) => containsRun(buffer, s));
}

export function isComplete(buffer: Code[], sequences: Code[][]): boolean {
  return evaluateSequences(buffer, sequences).every(Boolean);
}

export function isFailed(buffer: Code[], sequences: Code[][], bufferSize: number): boolean {
  return buffer.length >= bufferSize && !isComplete(buffer, sequences);
}

/** A random legal walk of `bufferSize` cells, or null if it dead-ends. */
function walk(size: number, bufferSize: number, rng: () => number): Cell[] | null {
  const path: Cell[] = [];
  for (let i = 0; i < bufferSize; i++) {
    const legal = legalCells(size, path);
    if (legal.length === 0) return null;
    path.push(pick(legal, rng));
  }
  return path;
}

export function generateBoard(opts: GenerateOptions = {}): Board {
  const size = opts.size ?? 5;
  const bufferSize = opts.bufferSize ?? 7;
  const seqLengths = opts.seqLengths ?? [2, 3, 3];
  const rng = opts.rng ?? Math.random;

  const maxSeq = Math.max(...seqLengths);
  if (maxSeq > bufferSize) {
    throw new Error(`sequence length ${maxSeq} exceeds buffer size ${bufferSize}`);
  }
  if (bufferSize > size * size) {
    throw new Error(`buffer size ${bufferSize} exceeds grid capacity ${size * size}`);
  }

  // 1) Find a legal solution walk (retry on dead-ends; large grid rarely sticks).
  let path: Cell[] | null = null;
  for (let attempt = 0; attempt < 100 && !path; attempt++) {
    path = walk(size, bufferSize, rng);
  }
  if (!path) throw new Error('could not generate a solvable board');

  // 2) Random grid; the codes already sitting on the walk become the master string.
  const grid: Code[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => pick(CODES, rng)),
  );
  const master = codesAlong(grid, path);

  // 3) Each target is a contiguous window of the master string -> all solvable by the
  //    single walk. Windows may overlap, mirroring multi-daemon buffers in CP2077.
  const sequences = seqLengths.map((len) => {
    const start = Math.floor(rng() * (master.length - len + 1));
    return master.slice(start, start + len);
  });

  return { grid, sequences, solutionPath: path };
}
