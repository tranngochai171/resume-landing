'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  generateBoard,
  nextLock,
  progress,
  isWin,
  keyOf,
  type Axis,
  type Board,
  type Cell,
  type Code,
} from './breach';

export interface BreachHandle {
  start: () => void;
}

const SIZE = 6;
const BUFFER = 9;
const DAEMON_LEN = 4;
const TIME = 50; // seconds — the "trace"

const PINK = '#FF2D95', CYAN = '#00E5FF', GREEN = '#27e08a', VOID = '#05050c';
const FG = '#c7c7da', MUTED = '#9a9ab4', DIM = '#7c7c98', FAINT = '#55556e';
const MONO = 'var(--mono)';
const DISPLAY = 'var(--display)';

// Fold the alternating-lock rule over the picks so far -> the constraint for the NEXT pick.
function lockFor(picks: Cell[]): { axis: Axis; lockIndex: number } {
  let axis: Axis = 'row';
  let lockIndex = 0;
  for (const p of picks) ({ axis, lockIndex } = nextLock(axis, p));
  return { axis, lockIndex };
}

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 60;
  try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch { window.scrollTo(0, y); }
};

export const BreachSection = forwardRef<BreachHandle, { sfx: (t: string) => void }>(function BreachSection(
  { sfx },
  ref,
) {
  const [board, setBoard] = useState<Board | null>(null);
  const [picks, setPicks] = useState<Cell[]>([]);
  const [active, setActive] = useState(false);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<'won' | 'lost' | null>(null);
  const [status, setStatus] = useState('AWAITING BREACH — press INITIATE');
  const [count, setCount] = useState(0);

  const barRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const timeLeftRef = useRef(TIME);
  const activeRef = useRef(false);
  const loseRef = useRef<() => void>(() => {});
  activeRef.current = active;

  const paintTimer = useCallback(() => {
    const pct = Math.max(0, timeLeftRef.current / TIME) * 100;
    if (barRef.current) {
      barRef.current.style.width = pct + '%';
      barRef.current.style.background = pct < 30 ? PINK : `linear-gradient(90deg,${CYAN},${PINK})`;
    }
    if (timeRef.current) timeRef.current.textContent = activeRef.current ? Math.max(0, timeLeftRef.current).toFixed(1) + 's' : '--';
  }, []);

  // initial idle board + persisted breach count (client only -> no hydration mismatch)
  useEffect(() => {
    setBoard(generateBoard({ size: SIZE, daemonLen: DAEMON_LEN }));
    try { setCount(parseInt(localStorage.getItem('topy_breaches') || '0', 10) || 0); } catch {}
  }, []);

  const start = useCallback(() => {
    setBoard(generateBoard({ size: SIZE, daemonLen: DAEMON_LEN }));
    setPicks([]);
    setResult(null);
    setStarted(true);
    setActive(true);
    setStatus('TRACE ACTIVE // select start node in ROW 1');
    timeLeftRef.current = TIME;
    sfx('open');
  }, [sfx]);

  useImperativeHandle(ref, () => ({ start }), [start]);

  const win = useCallback(() => {
    setActive(false);
    let n = 0;
    try { n = (parseInt(localStorage.getItem('topy_breaches') || '0', 10) || 0) + 1; localStorage.setItem('topy_breaches', String(n)); } catch { n = count + 1; }
    setCount(n);
    sfx('success');
    setStatus('DAEMON UPLOADED // access granted');
    setResult('won');
  }, [sfx, count]);

  const lose = useCallback(() => {
    setActive(false);
    sfx('error');
    setStatus('TRACE COMPLETE // connection severed');
    setResult('lost');
  }, [sfx]);
  loseRef.current = lose;

  // trace countdown — ref-driven so the matrix doesn't re-render every frame
  useEffect(() => {
    if (!active) return;
    lastRef.current = performance.now();
    const loop = () => {
      const n = performance.now();
      timeLeftRef.current -= (n - lastRef.current) / 1000;
      lastRef.current = n;
      if (timeLeftRef.current <= 0) { timeLeftRef.current = 0; paintTimer(); loseRef.current(); return; }
      paintTimer();
      rafRef.current = requestAnimationFrame(loop);
    };
    paintTimer();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, paintTimer]);

  // keep the bar correct when idle / after reset
  useEffect(() => { if (!active) paintTimer(); }, [active, board, paintTimer]);

  const onCell = (r: number, c: number) => {
    if (!active || !board) return;
    const usedSet = new Set(picks.map(keyOf));
    if (usedSet.has(`${r},${c}`)) return;
    const { axis, lockIndex } = lockFor(picks);
    if (axis === 'row' && r !== lockIndex) return;
    if (axis === 'col' && c !== lockIndex) return;

    const next = [...picks, { r, c }];
    setPicks(next);
    sfx('key');
    const buf = next.map((p) => board.grid[p.r][p.c]);
    if (isWin(buf, board.target)) { win(); return; }
    if (buf.length >= BUFFER) { lose(); return; }
    const nl = nextLock(axis, { r, c });
    const m = progress(buf, board.target);
    setStatus(`SELECT FROM ${nl.axis === 'row' ? 'ROW ' + (nl.lockIndex + 1) : 'COLUMN ' + (nl.lockIndex + 1)} // ${m}/${board.target.length} matched`);
  };

  const used = new Set(picks.map(keyOf));
  const buffer: Code[] = board ? picks.map((p) => board.grid[p.r][p.c]) : [];
  const matched = board ? progress(buffer, board.target) : 0;
  const { axis, lockIndex } = lockFor(picks);
  const axisLabel = active ? `// ${axis === 'row' ? 'ROW ' + (lockIndex + 1) : 'COL ' + (lockIndex + 1)} LOCKED` : '// AWAITING';

  const label = (color: string): React.CSSProperties => ({ fontFamily: MONO, fontSize: 10.5, letterSpacing: '.18em', color });
  const btnBase: React.CSSProperties = { cursor: 'pointer', fontFamily: MONO, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', padding: '12px 18px', borderRadius: 2 };

  return (
    <section id="breach" className="os-section">
      <div className="os-wrap">
        <div className="os-eyebrow" data-reveal>[ 06 // BREACH ]</div>
        <h2 className="os-h2" data-reveal data-scramble data-text="BREACH PROTOCOL">BREACH PROTOCOL</h2>
        <p className="os-p" data-reveal style={{ maxWidth: 660, marginBottom: 26 }}>
          Bored of scrolling? Breach the node. Pick a code — your next pick locks to its <span className="c">column</span>, then its <span className="p">row</span>. Line the daemon up in your buffer before the trace catches you.{' '}
          <span style={{ color: DIM, fontFamily: MONO, fontSize: 13 }}>(or type </span>
          <span style={{ color: PINK, fontFamily: MONO, fontSize: 13 }}>breach</span>
          <span style={{ color: DIM, fontFamily: MONO, fontSize: 13 }}> in the terminal)</span>
        </p>

        <div data-reveal style={{ position: 'relative', border: '1px solid rgba(0,229,255,.28)', borderRadius: 6, overflow: 'hidden', background: '#07070f', boxShadow: '0 0 50px rgba(0,229,255,.07)' }}>
          {/* console head */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)', fontFamily: MONO, fontSize: 10.5, letterSpacing: '.14em', color: DIM }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: PINK }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f2c14e' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: GREEN }} />
              <span style={{ marginLeft: 6 }}>breach//ICE — secure node</span>
            </span>
            <span style={{ color: PINK }}>⚠ INTRUSION COUNTERMEASURES</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(18px,3vw,34px)', padding: 'clamp(18px,3vw,30px)' }}>
            {/* code matrix */}
            <div>
              <div style={label(PINK)}>CODE MATRIX <span style={{ color: FAINT }}>{axisLabel}</span></div>
              <div role="group" aria-label="Code matrix" style={{ display: 'grid', gap: 6, marginTop: 12, gridTemplateColumns: `repeat(${SIZE},1fr)` }}>
                {board
                  ? board.grid.map((row, r) => row.map((code, c) => {
                      const isUsed = used.has(`${r},${c}`);
                      const onLine = (axis === 'row' && r === lockIndex) || (axis === 'col' && c === lockIndex);
                      const sel = active && !isUsed && onLine;
                      const cs: React.CSSProperties = {
                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: MONO, fontSize: 'clamp(11px,1.9vw,15px)', letterSpacing: '.04em', borderRadius: 3, padding: 0,
                        background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.08)', color: FG,
                        boxShadow: 'none', cursor: 'default', opacity: 1, textDecoration: 'none', transition: 'all .12s',
                      };
                      if (isUsed) { cs.opacity = .22; cs.color = FAINT; cs.textDecoration = 'line-through'; }
                      else if (sel) { cs.background = 'rgba(0,229,255,.1)'; cs.border = `1px solid ${CYAN}`; cs.color = '#fff'; cs.boxShadow = '0 0 14px rgba(0,229,255,.4)'; cs.cursor = 'pointer'; }
                      else if (active && onLine) { cs.border = '1px solid rgba(0,229,255,.3)'; }
                      return (
                        <button
                          type="button"
                          key={`${r},${c}`}
                          className="os-breach-cell"
                          style={cs}
                          disabled={!sel}
                          onClick={() => onCell(r, c)}
                          aria-label={`Row ${r + 1} column ${c + 1}, code ${code}${sel ? ', selectable' : ''}`}
                        >
                          {code}
                        </button>
                      );
                    }))
                  : Array.from({ length: SIZE * SIZE }, (_, i) => (
                      <span key={i} aria-hidden="true" style={{ aspectRatio: '1', borderRadius: 3, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }} />
                    ))}
              </div>
            </div>

            {/* right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={label(CYAN)}>TARGET DAEMON</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {board?.target.map((v, i) => {
                    const on = i < matched;
                    return (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 36, padding: '7px 9px', borderRadius: 3, fontFamily: MONO, fontSize: 12.5, border: `1px solid ${on ? GREEN : 'rgba(255,255,255,.18)'}`, background: on ? 'rgba(39,224,138,.14)' : 'transparent', color: on ? GREEN : FG }}>{v}</span>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={label(DIM)}>BUFFER</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {Array.from({ length: BUFFER }, (_, i) => {
                    const v = buffer[i];
                    return (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 32, height: 30, padding: '0 7px', borderRadius: 3, fontFamily: MONO, fontSize: 12, border: `1px solid ${v ? 'rgba(0,229,255,.4)' : 'rgba(255,255,255,.1)'}`, background: v ? 'rgba(0,229,255,.08)' : 'transparent', color: v ? CYAN : '#3a3a52' }}>{v || '·'}</span>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', ...label(DIM) }}>
                  <span>TRACE</span><span ref={timeRef} style={{ color: CYAN }}>--</span>
                </div>
                <div style={{ marginTop: 10, height: 7, background: 'rgba(255,255,255,.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div ref={barRef} style={{ height: '100%', width: '100%', background: `linear-gradient(90deg,${CYAN},${PINK})` }} />
                </div>
              </div>

              <div role="status" aria-live="polite" style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: '.04em', color: MUTED, minHeight: 16 }}>{status}</div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={start} style={{ ...btnBase, color: VOID, fontWeight: 700, background: CYAN, border: 'none', boxShadow: '0 0 22px rgba(0,229,255,.45)' }}>
                  {started ? 'Restart Breach ⟳' : 'Initiate Breach ▸'}
                </button>
                <button type="button" onClick={start} style={{ ...btnBase, color: MUTED, background: 'none', border: '1px solid rgba(255,255,255,.18)' }}>New Matrix ⟳</button>
              </div>

              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.16em', color: FAINT }}>BREACHES LOGGED: <span style={{ color: GREEN }}>{count}</span></div>
            </div>
          </div>

          {/* result overlay */}
          {result && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(5,5,12,.93)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', animation: 'os-expandIn .3s ease both' }}>
              {result === 'won' ? (
                <div style={{ textAlign: 'center', maxWidth: 460 }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.3em', color: GREEN, marginBottom: 10 }}>{'// ROOT ACCESS GRANTED'}</div>
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(30px,6vw,54px)', color: '#fff', lineHeight: 1, textShadow: '0 0 30px rgba(0,229,255,.7)' }}>DAEMON UPLOADED</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED, marginTop: 14, lineHeight: 1.8 }}>access code <span style={{ color: PINK }}>HIRE-TOPY-2026</span><br />That&rsquo;s the methodical problem-solving I bring to a codebase.<br />Building something hard? Let&rsquo;s talk.</div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
                    <button type="button" onClick={() => { setResult(null); scrollToId('contact'); }} style={{ ...btnBase, border: 'none', color: VOID, fontWeight: 700, background: PINK, boxShadow: '0 0 24px rgba(255,45,149,.5)' }}>Establish Connection ↗</button>
                    <button type="button" onClick={start} style={{ ...btnBase, border: '1px solid rgba(255,255,255,.2)', color: MUTED, background: 'none' }}>Run Again ⟳</button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', maxWidth: 420 }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.3em', color: PINK, marginBottom: 10 }}>{'// TRACE DETECTED'}</div>
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(28px,6vw,50px)', color: '#fff', lineHeight: 1, textShadow: '0 0 30px rgba(255,45,149,.7)' }}>BREACH FAILED</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED, marginTop: 14, lineHeight: 1.8 }}>The ICE won this round.<br />Recompile and run it back.</div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
                    <button type="button" onClick={start} style={{ ...btnBase, border: `1px solid ${CYAN}`, color: CYAN, background: 'rgba(0,229,255,.06)' }}>Retry ⟳</button>
                    <button type="button" onClick={() => { setResult(null); scrollToId('contact'); }} style={{ ...btnBase, border: '1px solid rgba(255,255,255,.2)', color: MUTED, background: 'none' }}>Skip to Contact →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
