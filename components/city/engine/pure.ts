// Math-only helpers of the Neon City engine (no three, no DOM) so they can be unit tested.
import { CPS, INTRO_LOG, type Sector } from '../data';

/** mulberry32: the design's seeded RNG. Same seed, same city. */
export function mkRng(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mouse-look dead zone: ignore the middle quarter of the screen, rescale the rest to 0..1. */
export const deadzone = (v: number) => (Math.abs(v) < 0.25 ? 0 : (v - Math.sign(v) * 0.25) / 0.75);

/** Loader percent for flyover progress `u` (reads 100 at 90% of the path). */
export const introPct = (u: number) => Math.min(100, Math.floor((u / 0.9) * 100));

export const introStatus = (pct: number) =>
  pct < 50 ? 'RENDERING NEON CITY' : pct < 90 ? 'DECRYPTING IDENTITY' : 'READY TO RIDE';

/** How many boot-log lines are visible at `pct`. */
export const introLogCount = (pct: number) => INTRO_LOG.filter((l) => pct >= l[0]).length;

/** Dashboard gear 0 (N) to 6 for speed `v`. */
export const gearOf = (v: number) => (v < 0.5 ? 0 : Math.min(6, 1 + Math.floor(v / 18)));

/** Dashboard rev bar 0..1 for speed `v` in gear `gi`. */
export const rpmOf = (v: number, gi: number) =>
  gi === 0 ? 0.08 : gi < 6 ? 0.3 + 0.68 * ((v % 18) / 18) : Math.min(1, 0.55 + (v - 90) / 100);

/** Speed readout: world units per second to the HUD's three-digit km/h. */
export const kmh = (v: number) => String(Math.round(v * 3.1)).padStart(3, '0');

/** Sector whose file is open at avenue position `z` (70 before its gate to 400 past it). */
export const sectorAt = (z: number): Sector | null => CPS.find((cp) => z <= cp.z + 70 && z >= cp.z - 400) ?? null;

/** Rail progress dot position (percent) for avenue position `z`. */
export const railTop = (z: number) => Math.max(0, Math.min(100, ((150 - z) / (150 + 2450)) * 100));
