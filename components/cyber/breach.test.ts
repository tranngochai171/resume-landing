import { describe, it, expect } from 'vitest';
import {
  makeRng,
  generateBoard,
  legalCells,
  codesAlong,
  evaluateSequences,
  isComplete,
  isFailed,
  type Cell,
} from './breach';

const keyOf = (c: Cell) => `${c.r},${c.c}`;

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
  const size = 5;

  it('first move is restricted to the top row', () => {
    const cells = legalCells(size, []);
    expect(cells).toHaveLength(size);
    expect(cells.every((c) => c.r === 0)).toBe(true);
    expect(cells.map((c) => c.c).sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('after one pick, locks to that column (excluding the used cell)', () => {
    const cells = legalCells(size, [{ r: 0, c: 2 }]);
    expect(cells.every((c) => c.c === 2)).toBe(true);
    expect(cells).toHaveLength(size - 1);
    expect(cells.some((c) => c.r === 0 && c.c === 2)).toBe(false);
  });

  it('after two picks, locks to the last pick row (excluding used cells)', () => {
    const picks: Cell[] = [
      { r: 0, c: 2 },
      { r: 3, c: 2 },
    ];
    const cells = legalCells(size, picks);
    expect(cells.every((c) => c.r === 3)).toBe(true);
    // row 3 has 5 cells; (3,2) already used -> 4 remain
    expect(cells).toHaveLength(size - 1);
    expect(cells.some((c) => keyOf(c) === keyOf({ r: 3, c: 2 }))).toBe(false);
  });
});

describe('evaluateSequences', () => {
  it('marks a sequence solved when it appears as a contiguous run', () => {
    const buffer = ['1C', '55', 'BD', 'E9'];
    const result = evaluateSequences(buffer, [['55', 'BD'], ['1C', 'BD']]);
    expect(result).toEqual([true, false]); // 55,BD contiguous; 1C,BD not
  });

  it('detects overlapping sequences within one buffer', () => {
    const buffer = ['1C', '55', 'BD', 'E9', '55'];
    const result = evaluateSequences(buffer, [
      ['1C', '55'],
      ['55', 'BD', 'E9'],
      ['E9', '55'],
    ]);
    expect(result).toEqual([true, true, true]);
  });

  it('returns false for a sequence longer than the buffer', () => {
    expect(evaluateSequences(['1C'], [['1C', '55']])).toEqual([false]);
  });
});

describe('isComplete / isFailed', () => {
  const seqs = [['55', 'BD']];
  it('isComplete true only when every sequence is solved', () => {
    expect(isComplete(['55', 'BD'], seqs)).toBe(true);
    expect(isComplete(['55'], seqs)).toBe(false);
  });

  it('isFailed when buffer is full and not all solved', () => {
    expect(isFailed(['1C', '7A'], seqs, 2)).toBe(true); // full, unsolved
    expect(isFailed(['55', 'BD'], seqs, 2)).toBe(false); // full but solved
    expect(isFailed(['1C'], seqs, 2)).toBe(false); // room left
  });
});

describe('generateBoard', () => {
  it('produces a solvable board: its solutionPath fills the buffer and solves every sequence', () => {
    const rng = makeRng(42);
    const board = generateBoard({ size: 5, bufferSize: 7, seqLengths: [2, 3, 3], rng });

    // grid shape
    expect(board.grid).toHaveLength(5);
    expect(board.grid.every((row) => row.length === 5)).toBe(true);

    // sequences match requested lengths
    expect(board.sequences.map((s) => s.length)).toEqual([2, 3, 3]);

    // solutionPath is a legal walk with no reused cells
    const seen = new Set<string>();
    for (let i = 0; i < board.solutionPath.length; i++) {
      const legal = legalCells(5, board.solutionPath.slice(0, i));
      const pick = board.solutionPath[i];
      expect(legal.some((c) => c.r === pick.r && c.c === pick.c)).toBe(true);
      expect(seen.has(keyOf(pick))).toBe(false);
      seen.add(keyOf(pick));
    }
    expect(board.solutionPath.length).toBe(7); // walk always fills the buffer exactly

    // following the solution path solves the whole board
    const buffer = codesAlong(board.grid, board.solutionPath);
    expect(evaluateSequences(buffer, board.sequences).every(Boolean)).toBe(true);
    expect(isComplete(buffer, board.sequences)).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    const a = generateBoard({ rng: makeRng(7) });
    const b = generateBoard({ rng: makeRng(7) });
    expect(a.grid).toEqual(b.grid);
    expect(a.sequences).toEqual(b.sequences);
    expect(a.solutionPath).toEqual(b.solutionPath);
  });

  it('throws when a sequence is longer than the buffer', () => {
    expect(() => generateBoard({ bufferSize: 3, seqLengths: [5] })).toThrow(/sequence length/);
  });

  it('throws when the buffer cannot fit on the grid', () => {
    expect(() => generateBoard({ size: 2, bufferSize: 5, seqLengths: [2] })).toThrow(/grid capacity/);
  });

  it('only uses two-hex-digit codes from the alphabet', () => {
    const board = generateBoard({ rng: makeRng(9) });
    const flat = board.grid.flat();
    expect(flat.every((code) => /^[0-9A-F]{2}$/.test(code))).toBe(true);
  });
});
