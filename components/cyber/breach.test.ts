import { describe, it, expect } from 'vitest';
import {
  makeRng,
  generateBoard,
  legalCells,
  nextLock,
  genPath,
  progress,
  isWin,
  isFail,
  keyOf,
  CODES,
  type Cell,
} from './breach';

describe('makeRng', () => {
  it('is deterministic for a given seed and stays in [0,1)', () => {
    const a = makeRng(123);
    const b = makeRng(123);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
    for (const n of seqA) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('produces different streams for different seeds', () => {
    expect(makeRng(1)()).not.toEqual(makeRng(2)());
  });
});

describe('legalCells', () => {
  const size = 6;

  it('row axis returns the whole locked row when nothing is used', () => {
    const cells = legalCells(size, 'row', 0, new Set());
    expect(cells).toHaveLength(size);
    expect(cells.every((c) => c.r === 0)).toBe(true);
    expect(cells.map((c) => c.c)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('col axis returns the locked column minus used cells', () => {
    const used = new Set([keyOf({ r: 2, c: 3 })]);
    const cells = legalCells(size, 'col', 3, used);
    expect(cells.every((c) => c.c === 3)).toBe(true);
    expect(cells).toHaveLength(size - 1);
    expect(cells.some((c) => c.r === 2)).toBe(false);
  });
});

describe('nextLock', () => {
  it('row pick locks the next axis to the chosen column', () => {
    expect(nextLock('row', { r: 1, c: 4 })).toEqual({ axis: 'col', lockIndex: 4 });
  });
  it('col pick locks the next axis to the chosen row', () => {
    expect(nextLock('col', { r: 5, c: 2 })).toEqual({ axis: 'row', lockIndex: 5 });
  });
});

describe('genPath', () => {
  it('is a legal alternating walk: starts in row 0, no reused cells', () => {
    const path = genPath(6, 7, makeRng(42));
    expect(path.length).toBeGreaterThan(0);
    expect(path[0].r).toBe(0); // first pick is free in the top row

    const used = new Set<string>();
    let axis: 'row' | 'col' = 'row';
    let lock = 0;
    for (const step of path) {
      const legal = legalCells(6, axis, lock, used);
      expect(legal.some((c) => c.r === step.r && c.c === step.c)).toBe(true);
      expect(used.has(keyOf(step))).toBe(false);
      used.add(keyOf(step));
      ({ axis, lockIndex: lock } = nextLock(axis, step));
    }
  });
});

describe('progress / isWin / isFail', () => {
  const target = ['1C', '55', 'BD', 'E9'];

  it('measures the longest buffer-suffix that prefixes the daemon', () => {
    expect(progress(['7A', '1C', '55'], target)).toBe(2); // ...1C,55
    expect(progress(['1C', '55', 'BD', 'E9'], target)).toBe(4);
    expect(progress(['1C', '55', 'BD', 'E9', 'FF'], target)).toBe(0); // suffix broken by FF
    expect(progress(['FF', 'A1'], target)).toBe(0);
  });

  it('wins only when the daemon sits at the tail of the buffer', () => {
    expect(isWin(['7A', '1C', '55', 'BD', 'E9'], target)).toBe(true);
    expect(isWin(['1C', '55', 'BD'], target)).toBe(false);
  });

  it('fails when the buffer is full without a win', () => {
    const full = ['7A', '7A', '7A', '7A']; // length 4, no daemon tail
    expect(isFail(full, 4, target)).toBe(true);
    expect(isFail(['1C', '55', 'BD', 'E9'], 4, target)).toBe(false); // full but won
    expect(isFail(['1C'], 4, target)).toBe(false); // room left
  });
});

describe('generateBoard', () => {
  it('produces a solvable 6x6 board whose solutionPath uploads the daemon', () => {
    const board = generateBoard({ size: 6, daemonLen: 4, rng: makeRng(7) });

    expect(board.grid).toHaveLength(6);
    expect(board.grid.every((row) => row.length === 6)).toBe(true);
    expect(board.target).toHaveLength(4);
    expect(board.solutionPath).toHaveLength(4);

    // the solution path is a legal walk with no reuse
    const used = new Set<string>();
    let axis: 'row' | 'col' = 'row';
    let lock = 0;
    for (const step of board.solutionPath) {
      const legal = legalCells(6, axis, lock, used);
      expect(legal.some((c) => c.r === step.r && c.c === step.c)).toBe(true);
      expect(used.has(keyOf(step))).toBe(false);
      used.add(keyOf(step));
      ({ axis, lockIndex: lock } = nextLock(axis, step));
    }

    // following the path fills the buffer with exactly the daemon -> win
    const buffer = board.solutionPath.map((p: Cell) => board.grid[p.r][p.c]);
    expect(buffer).toEqual(board.target);
    expect(isWin(buffer, board.target)).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    const a = generateBoard({ rng: makeRng(9) });
    const b = generateBoard({ rng: makeRng(9) });
    expect(a.grid).toEqual(b.grid);
    expect(a.target).toEqual(b.target);
    expect(a.solutionPath).toEqual(b.solutionPath);
  });

  it('only uses codes from the CODES alphabet', () => {
    const board = generateBoard({ rng: makeRng(11) });
    const allowed = new Set(CODES);
    expect(board.grid.flat().every((code) => allowed.has(code))).toBe(true);
  });
});
