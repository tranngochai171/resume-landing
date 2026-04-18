export interface Beat {
  id: 'intro' | 'nickname' | 'role' | 'portfolio' | 'invitation';
  range: [number, number];
}

export const beats: Beat[] = [
  { id: 'intro',      range: [-0.10, 0.22] },
  { id: 'nickname',   range: [0.20, 0.42] },
  { id: 'role',       range: [0.40, 0.62] },
  { id: 'portfolio',  range: [0.60, 0.87] },
  { id: 'invitation', range: [0.85, 1.00] },
];

// Smooth in/out inside a progress range.
// Returns 0 outside [start, end], ramps 0→1 over first 15% of the range,
// holds at 1, ramps 1→0 over last 15%. Produces the ~200ms crossfade overlap.
export function beatOpacity(progress: number, [start, end]: [number, number]): number {
  if (progress < start || progress > end) return 0;
  const span = end - start;
  const local = (progress - start) / span;
  const fade = 0.15;
  if (local < fade) return local / fade;
  if (local > 1 - fade) return (1 - local) / fade;
  return 1;
}
