import { describe, expect, it } from 'vitest';
import { deadzone, gearOf, introLogCount, introPct, introStatus, kmh, mkRng, railTop, rpmOf, sectorAt } from './pure';

// The design's RNG, verbatim from the prototype: the city must be generated from the exact same sequence.
// prettier-ignore
// eslint-disable-next-line
function designRng(s: number) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

describe('mkRng', () => {
  it('reproduces the design sequence for the city (1337) and AC-unit (99) seeds', () => {
    for (const seed of [1337, 99]) {
      const a = mkRng(seed), b = designRng(seed);
      for (let i = 0; i < 50000; i++) expect(a()).toBe(b());
    }
  });

  it('stays in [0, 1)', () => {
    const r = mkRng(7);
    for (let i = 0; i < 10000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('deadzone', () => {
  it('ignores the middle quarter and rescales the rest to reach 1 at the edge', () => {
    expect(deadzone(0)).toBe(0);
    expect(deadzone(0.2)).toBe(0);
    expect(deadzone(-0.2)).toBe(0);
    expect(deadzone(1)).toBe(1);
    expect(deadzone(-1)).toBe(-1);
    expect(deadzone(0.625)).toBeCloseTo(0.5);
  });
});

describe('intro loader', () => {
  it('reads 100% at 90% of the flyover', () => {
    expect(introPct(0)).toBe(0);
    expect(introPct(0.45)).toBe(50);
    expect(introPct(0.9)).toBe(100);
    expect(introPct(1.3)).toBe(100);
  });

  it('switches status at 50% and 90%', () => {
    expect(introStatus(49)).toBe('RENDERING NEON CITY');
    expect(introStatus(50)).toBe('DECRYPTING IDENTITY');
    expect(introStatus(90)).toBe('READY TO RIDE');
  });

  it('reveals boot log lines as their thresholds pass', () => {
    expect(introLogCount(0)).toBe(1);
    expect(introLogCount(9)).toBe(1);
    expect(introLogCount(10)).toBe(2);
    expect(introLogCount(91)).toBe(7);
    expect(introLogCount(100)).toBe(8);
  });
});

describe('dashboard', () => {
  it('shifts through gears every 18 units and tops out at 6', () => {
    expect(gearOf(0)).toBe(0);
    expect(gearOf(0.4)).toBe(0);
    expect(gearOf(1)).toBe(1);
    expect(gearOf(18)).toBe(2);
    expect(gearOf(90)).toBe(6);
    expect(gearOf(139)).toBe(6);
  });

  it('idles the rev bar in neutral and caps it at 1', () => {
    expect(rpmOf(0, 0)).toBe(0.08);
    expect(rpmOf(9, 1)).toBeCloseTo(0.64);
    expect(rpmOf(500, 6)).toBe(1);
  });

  it('formats speed as three-digit km/h', () => {
    expect(kmh(0)).toBe('000');
    expect(kmh(10)).toBe('031');
    expect(kmh(139.5)).toBe('432');
  });
});

describe('sectorAt', () => {
  it('opens a file from 70 before a gate to 400 past it', () => {
    expect(sectorAt(150)).toBeNull();
    expect(sectorAt(-180)?.id).toBe('about');
    expect(sectorAt(-181)?.id).toBe('about');
    expect(sectorAt(-650)?.id).toBe('about');
    expect(sectorAt(-660)).toBeNull();
    expect(sectorAt(-700)?.id).toBe('work');
    expect(sectorAt(-1750)?.id).toBe('stack');
    expect(sectorAt(-2650)?.id).toBe('contact');
    expect(sectorAt(-2651)).toBeNull();
  });
});

describe('railTop', () => {
  it('maps the avenue start to 0% and the loop point to 100%', () => {
    expect(railTop(150)).toBe(0);
    expect(railTop(170)).toBe(0);
    expect(railTop(-2450)).toBe(100);
    expect(railTop(-2700)).toBe(100);
    expect(railTop(-1150)).toBe(50);
  });
});
