// Placeholder until the engine port lands: failing here makes CityHome serve the 2D page.
export type CityHandle = { dispose(): void };

export function createCity(): CityHandle {
  throw new Error('Neon City engine not ported yet');
}
