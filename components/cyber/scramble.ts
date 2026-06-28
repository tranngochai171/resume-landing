// Text-scramble effect ported from the TOPY.OS .dc.html prototype.
// Resolves each character from random glyphs to its final value over a few frames.
const CHARS = '01<>-_/\\[]{}=+*#%&ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Animate `el` from scrambled glyphs to its `data-text` (or current text). Returns a cancel fn. */
export function scramble(el: HTMLElement): () => void {
  const text = el.getAttribute('data-text') || el.textContent || '';
  const queue = Array.from(text, (to) => {
    const start = Math.floor(Math.random() * 18);
    return { to, start, end: start + 8 + Math.floor(Math.random() * 22), char: '' };
  });
  let frame = 0;
  let raf = 0;
  const update = () => {
    let out = '';
    let done = 0;
    for (const q of queue) {
      if (frame >= q.end) {
        done++;
        out += q.to;
      } else if (frame >= q.start) {
        if (!q.char || Math.random() < 0.28) q.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        out += `<span style="color:#00e5ff;opacity:.75">${q.char}</span>`;
      } else {
        out += q.to === ' ' ? ' ' : '';
      }
    }
    el.innerHTML = out;
    if (done === queue.length) return;
    frame++;
    raf = requestAnimationFrame(update);
  };
  update();
  return () => cancelAnimationFrame(raf);
}
