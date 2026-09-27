import * as T from 'three';

/** Font stacks resolved from next/font (their family names are hashed), used by canvas-drawn signage. */
export type Fonts = { display: string; mono: string };

export function canvasTex(cw: number, ch: number, draw: (g: CanvasRenderingContext2D, W: number, H: number) => void) {
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const g = c.getContext('2d');
  if (g) draw(g, cw, ch);
  const t = new T.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/** Neon shop sign texture (horizontal 512x128 or vertical 128x512), cached per text/colour/orientation. */
export function signTex(cache: Map<string, T.CanvasTexture>, fonts: Fonts, text: string, color: string, vertical: boolean) {
  const key = text + color + vertical;
  const hit = cache.get(key);
  if (hit) return hit;
  const t = canvasTex(vertical ? 128 : 512, vertical ? 512 : 128, (g, W, H) => {
    g.fillStyle = 'rgba(8,4,18,0.88)';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = color;
    g.lineWidth = 6;
    g.shadowColor = color;
    g.shadowBlur = 20;
    g.strokeRect(12, 12, W - 24, H - 24);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const fam = `${fonts.display},"Hiragino Sans","Noto Sans JP","Yu Gothic",sans-serif`;
    const paint = (fn: () => void) => {
      g.shadowBlur = 26;
      g.fillStyle = color;
      fn();
      g.shadowBlur = 6;
      g.fillStyle = 'rgba(255,255,255,.85)';
      fn();
    };
    if (vertical) {
      const ch = Array.from(text);
      const fs = Math.min(92, 430 / ch.length);
      g.font = `700 ${fs}px ${fam}`;
      paint(() => ch.forEach((c, i) => g.fillText(c, 64, 256 + (i - (ch.length - 1) / 2) * fs * 1.02)));
    } else {
      let fs = 78;
      g.font = `700 ${fs}px ${fam}`;
      while (g.measureText(text).width > 450 && fs > 20) {
        fs -= 4;
        g.font = `700 ${fs}px ${fam}`;
      }
      paint(() => g.fillText(text, 256, 68));
    }
  });
  cache.set(key, t);
  return t;
}

/** Soft white radial falloff used for glows, halos and light pools. */
export function radialTex(size: number, stops: [number, string][]) {
  return canvasTex(size, size, (g, W, H) => {
    const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  });
}
